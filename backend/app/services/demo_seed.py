from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.row import Row
from app.models.spreadsheet import Spreadsheet, SpreadsheetColumn
from app.models.user import User
from app.services.ingest import ingest_file

# Guest (per-visitor demo) accounts are identified by this email prefix so they
# can be created on the fly and garbage-collected without touching real users.
GUEST_PREFIX = "guest-"
GUEST_DOMAIN = "demo.forge.app"
GUEST_TTL = timedelta(hours=6)

SAMPLE_NAME = "Employee Directory"
SAMPLE_FILENAME = "employees.csv"

# Bundled sample dataset so every guest sandbox starts with the same polished
# data (KPIs + charts look great immediately) instead of an empty account.
SAMPLE_CSV = """Name,Email,Department,Role,City,Salary,Age,Start Date,Active,Performance
Aarav Sharma,aarav.sharma@acme.io,Engineering,Senior Engineer,Singapore,142000,34,2019-03-12,True,4.6
Mei Lin,mei.lin@acme.io,Design,Product Designer,Hong Kong,98000,29,2021-07-01,True,4.2
James Carter,james.carter@acme.io,Sales,Account Executive,London,87000,41,2018-11-23,True,3.8
Sofia Rossi,sofia.rossi@acme.io,Marketing,Growth Lead,New York,105000,37,2020-01-15,True,4.4
Kenji Tanaka,kenji.tanaka@acme.io,Engineering,Staff Engineer,Tokyo,158000,45,2016-05-30,True,4.9
Priya Nair,priya.nair@acme.io,Finance,Financial Analyst,Singapore,76000,28,2022-09-10,True,4.0
Lucas Müller,lucas.muller@acme.io,Engineering,Backend Engineer,London,121000,31,2020-08-19,False,3.5
Chloe Dubois,chloe.dubois@acme.io,Design,UX Researcher,New York,92000,33,2021-02-28,True,4.1
Ravi Patel,ravi.patel@acme.io,Sales,Sales Manager,Hong Kong,134000,48,2015-06-14,True,4.7
Hana Kim,hana.kim@acme.io,Marketing,Content Strategist,Tokyo,71000,26,2023-04-03,True,3.9
Daniel Owusu,daniel.owusu@acme.io,Engineering,Frontend Engineer,London,118000,30,2021-10-22,True,4.3
Isabella Santos,isabella.santos@acme.io,Finance,Controller,New York,129000,44,2017-12-05,True,4.5
Wei Zhang,wei.zhang@acme.io,Engineering,ML Engineer,Singapore,147000,36,2019-09-17,True,4.8
Emma Johnson,emma.johnson@acme.io,Sales,Account Executive,London,84000,27,2022-03-29,False,3.4
Omar Hassan,omar.hassan@acme.io,Marketing,SEO Specialist,Hong Kong,68000,32,2021-11-08,True,3.7
Yuki Sato,yuki.sato@acme.io,Design,Design Lead,Tokyo,112000,39,2018-07-26,True,4.6
Grace Lee,grace.lee@acme.io,Finance,Financial Analyst,Singapore,79000,25,2023-01-19,True,4.0
Mateo Garcia,mateo.garcia@acme.io,Engineering,DevOps Engineer,New York,125000,35,2020-04-11,True,4.2
Ananya Reddy,ananya.reddy@acme.io,Sales,SDR,Hong Kong,62000,24,2023-06-30,True,3.6
Liam O'Brien,liam.obrien@acme.io,Marketing,Brand Manager,London,99000,40,2019-02-14,False,4.1
Sakura Mori,sakura.mori@acme.io,Design,Product Designer,Tokyo,96000,28,2022-05-20,True,4.3
Noah Williams,noah.williams@acme.io,Engineering,Senior Engineer,Singapore,139000,38,2018-10-09,True,4.7
Fatima Khan,fatima.khan@acme.io,Finance,Treasury Analyst,Hong Kong,83000,30,2021-08-25,True,4.0
Ethan Brown,ethan.brown@acme.io,Sales,Sales Manager,New York,131000,46,2016-03-18,True,4.5
Linh Nguyen,linh.nguyen@acme.io,Marketing,Growth Lead,Singapore,107000,33,2020-12-01,True,4.4
Carlos Mendez,carlos.mendez@acme.io,Engineering,Backend Engineer,London,120000,29,2021-09-13,False,3.8
Aiko Yamamoto,aiko.yamamoto@acme.io,Design,UX Researcher,Tokyo,90000,31,2022-02-07,True,4.2
Olivia Davis,olivia.davis@acme.io,Finance,Controller,New York,127000,43,2017-07-22,True,4.6
Arjun Mehta,arjun.mehta@acme.io,Engineering,Staff Engineer,Singapore,155000,42,2016-11-28,True,4.9
Sophie Martin,sophie.martin@acme.io,Marketing,Content Strategist,London,72000,27,2023-03-15,True,3.9
"""


def _prune_expired_guests(db: Session) -> None:
    """Best-effort GC of stale guest sandboxes so the demo doesn't accumulate
    abandoned accounts. Cascades drop their spreadsheets/rows/columns."""
    cutoff = datetime.now(timezone.utc) - GUEST_TTL
    stale = db.execute(
        select(User).where(
            User.email.like(f"{GUEST_PREFIX}%@{GUEST_DOMAIN}"),
            User.created_at < cutoff,
        )
    ).scalars().all()
    for user in stale:
        db.delete(user)
    if stale:
        db.flush()


def create_guest_user(db: Session) -> User:
    """Provision a fresh, isolated demo sandbox: a throwaway guest account
    pre-loaded with the bundled sample dataset. Each visitor gets their own,
    so uploads/edits are never shared between people."""
    _prune_expired_guests(db)

    token = secrets.token_hex(8)
    user = User(
        email=f"{GUEST_PREFIX}{token}@{GUEST_DOMAIN}",
        full_name="Guest",
        hashed_password=hash_password(secrets.token_urlsafe(24)),
    )
    db.add(user)
    db.flush()

    schema, rows_data = ingest_file(SAMPLE_FILENAME, SAMPLE_CSV.encode("utf-8"))
    # Drop any all-empty rows (e.g. a trailing blank line) so the sandbox never
    # shows a junk record.
    rows_data = [r for r in rows_data if any(v is not None for v in r.values())]
    sheet = Spreadsheet(
        owner_id=user.id,
        name=SAMPLE_NAME,
        filename=SAMPLE_FILENAME,
        row_count=len(rows_data),
        status="ready",
        source_type="csv",
    )
    db.add(sheet)
    db.flush()

    for col in schema:
        db.add(SpreadsheetColumn(
            spreadsheet_id=sheet.id,
            name=col.name,
            slug=col.slug,
            position=col.position,
            inferred_type=col.inferred_type,
            enum_values=col.enum_values,
            nullable=col.nullable,
            sample_values=col.sample_values,
            stats=col.stats,
        ))
    for i, row_data in enumerate(rows_data):
        db.add(Row(spreadsheet_id=sheet.id, row_index=i, data=row_data))

    db.commit()
    db.refresh(user)
    return user
