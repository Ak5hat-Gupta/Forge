from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.row import Row
from app.models.user import User
from app.repositories import RowRepository, SpreadsheetRepository
from app.schemas.row import PaginatedRows, RowCreate, RowOut, RowUpdate

router = APIRouter(prefix="/spreadsheets/{spreadsheet_id}/rows", tags=["rows"])


def _get_spreadsheet_or_404(spreadsheet_id: int, db: Session, user: User):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    return s


@router.get("", response_model=PaginatedRows)
def list_rows(
    spreadsheet_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    search: str = Query(""),
    sort_by: str | None = Query(None),
    sort_dir: str = Query("asc"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)

    filters = {}
    # Parse filter params from query string (not natively supported by FastAPI Query)
    # Handled via request object in a real app; simplified here

    repo = RowRepository(db)
    rows, total = repo.query_rows(
        spreadsheet_id=s.id,
        columns=list(s.columns),
        search=search,
        filters=filters,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        per_page=per_page,
    )

    return PaginatedRows(
        rows=[RowOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, (total + per_page - 1) // per_page),
    )


@router.post("", response_model=RowOut, status_code=201)
def create_row(
    spreadsheet_id: int,
    payload: RowCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)
    repo = RowRepository(db)
    next_index = repo.get_max_index(s.id) + 1

    row = repo.add(Row(
        spreadsheet_id=s.id,
        row_index=next_index,
        data=payload.data,
    ))

    s.row_count += 1
    db.commit()
    db.refresh(row)
    return RowOut.model_validate(row)


@router.get("/export", response_model=None)
def export_csv(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)
    repo = RowRepository(db)
    rows, _ = repo.query_rows(
        spreadsheet_id=s.id,
        columns=list(s.columns),
        per_page=100000,
    )

    output = io.StringIO()
    slugs = [c.slug for c in s.columns]
    names = [c.name for c in s.columns]
    writer = csv.writer(output)
    writer.writerow(names)
    for row in rows:
        writer.writerow([row.data.get(slug, "") for slug in slugs])

    output.seek(0)
    filename = (s.filename or s.name or "export").rsplit(".", 1)[0] + ".csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{row_id}", response_model=RowOut)
def get_row(
    spreadsheet_id: int,
    row_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)
    row = db.get(Row, row_id)
    if not row or row.spreadsheet_id != s.id:
        raise HTTPException(status_code=404, detail="Row not found.")
    return RowOut.model_validate(row)


@router.put("/{row_id}", response_model=RowOut)
def update_row(
    spreadsheet_id: int,
    row_id: int,
    payload: RowUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)
    row = db.get(Row, row_id)
    if not row or row.spreadsheet_id != s.id:
        raise HTTPException(status_code=404, detail="Row not found.")
    row.data = payload.data
    db.commit()
    db.refresh(row)
    return RowOut.model_validate(row)


@router.delete("/{row_id}", status_code=204)
def delete_row(
    spreadsheet_id: int,
    row_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = _get_spreadsheet_or_404(spreadsheet_id, db, current)
    row = db.get(Row, row_id)
    if not row or row.spreadsheet_id != s.id:
        raise HTTPException(status_code=404, detail="Row not found.")
    db.delete(row)
    s.row_count = max(0, s.row_count - 1)
    db.commit()
