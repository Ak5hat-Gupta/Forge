from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.repositories.row import RowRepository
from app.repositories.spreadsheet import SpreadsheetRepository
from app.schemas.spreadsheet import ColumnOut, SpreadsheetOut

router = APIRouter(tags=["share"])


@router.post("/spreadsheets/{spreadsheet_id}/share")
def toggle_share(
    spreadsheet_id: int,
    enable: bool = Query(True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    sheet = repo.get_with_columns(spreadsheet_id)
    if not sheet or sheet.owner_id != user.id:
        raise HTTPException(404, "Spreadsheet not found")

    if enable:
        if not sheet.share_token:
            sheet.share_token = secrets.token_urlsafe(12)
    else:
        sheet.share_token = None
    db.commit()
    db.refresh(sheet)
    return {"share_token": sheet.share_token, "shared": sheet.share_token is not None}


@router.get("/public/{token}", response_model=SpreadsheetOut)
def public_spreadsheet(token: str, db: Session = Depends(get_db)):
    sheet = SpreadsheetRepository(db).get_by_share_token(token)
    if not sheet:
        raise HTTPException(404, "Shared spreadsheet not found")
    return SpreadsheetOut.model_validate(sheet)


@router.get("/public/{token}/rows")
def public_rows(
    token: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    search: str = "",
    sort_by: str | None = None,
    sort_dir: str = "asc",
    db: Session = Depends(get_db),
):
    repo = SpreadsheetRepository(db)
    sheet = repo.get_by_share_token(token)
    if not sheet:
        raise HTTPException(404, "Shared spreadsheet not found")

    row_repo = RowRepository(db)
    rows, total = row_repo.query_rows(
        spreadsheet_id=sheet.id,
        columns=list(sheet.columns),
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        per_page=per_page,
    )
    return {
        "rows": [
            {
                "id": r.id,
                "spreadsheet_id": r.spreadsheet_id,
                "row_index": r.row_index,
                "data": r.data,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 1,
        "columns": [ColumnOut.model_validate(c).model_dump() for c in sheet.columns],
        "name": sheet.name,
    }
