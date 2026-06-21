from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.repositories.spreadsheet import SpreadsheetRepository
from app.repositories.row import RowRepository
from app.services.codegen import generate_zip, preview_files

router = APIRouter(tags=["eject"])


@router.get("/spreadsheets/{spreadsheet_id}/eject")
def eject_zip(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    sheet = repo.get_with_columns(spreadsheet_id)
    if not sheet or sheet.owner_id != user.id:
        raise HTTPException(404, "Spreadsheet not found")

    rows = RowRepository(db).list_by_spreadsheet(spreadsheet_id)
    zip_bytes = generate_zip(sheet, rows)

    filename = f"{sheet.name.lower().replace(' ', '_')}_forge.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/spreadsheets/{spreadsheet_id}/eject/preview")
def eject_preview(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    sheet = repo.get_with_columns(spreadsheet_id)
    if not sheet or sheet.owner_id != user.id:
        raise HTTPException(404, "Spreadsheet not found")

    rows = RowRepository(db).list_by_spreadsheet(spreadsheet_id, limit=10)
    files = preview_files(sheet, rows)
    return {
        "files": [{"path": p, "content": c} for p, c in files.items()],
        "summary": {
            "backend_files": sum(1 for p in files if p.startswith("backend/")),
            "frontend_files": sum(1 for p in files if p.startswith("web/")),
            "total_files": len(files) + 4,  # +tsconfig, tailwind, postcss, next.config, globals
        },
    }
