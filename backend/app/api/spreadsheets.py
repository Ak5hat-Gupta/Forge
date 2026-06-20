from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.row import Row
from app.models.spreadsheet import Spreadsheet, SpreadsheetColumn
from app.models.user import User
from app.repositories import SpreadsheetRepository
from app.schemas.spreadsheet import ColumnOut, SpreadsheetListOut, SpreadsheetOut, SpreadsheetUpdate
from app.services.ingest import ingest_file

router = APIRouter(prefix="/spreadsheets", tags=["spreadsheets"])


@router.get("", response_model=list[SpreadsheetListOut])
def list_spreadsheets(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    return [SpreadsheetListOut.model_validate(s) for s in repo.list_by_owner(current.id)]


@router.post("/upload", response_model=SpreadsheetOut, status_code=201)
async def upload_spreadsheet(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    content = await file.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.max_upload_mb}MB limit.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")

    name = file.filename.rsplit(".", 1)[0] if "." in file.filename else file.filename
    source_type = "xlsx" if ext in ("xlsx", "xls") else "csv"

    schema, rows_data = ingest_file(file.filename, content)
    if not schema:
        raise HTTPException(status_code=400, detail="Could not parse the file. Is it empty?")

    spreadsheet = Spreadsheet(
        owner_id=current.id,
        name=name,
        filename=file.filename,
        row_count=len(rows_data),
        status="ready",
        source_type=source_type,
    )
    db.add(spreadsheet)
    db.flush()

    for col in schema:
        db.add(SpreadsheetColumn(
            spreadsheet_id=spreadsheet.id,
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
        db.add(Row(
            spreadsheet_id=spreadsheet.id,
            row_index=i,
            data=row_data,
        ))

    db.commit()
    db.refresh(spreadsheet)

    return SpreadsheetOut.model_validate(
        SpreadsheetRepository(db).get_with_columns(spreadsheet.id)
    )


@router.get("/{spreadsheet_id}", response_model=SpreadsheetOut)
def get_spreadsheet(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    return SpreadsheetOut.model_validate(s)


@router.patch("/{spreadsheet_id}", response_model=SpreadsheetOut)
def update_spreadsheet(
    spreadsheet_id: int,
    payload: SpreadsheetUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    if payload.name is not None:
        s.name = payload.name
    db.commit()
    db.refresh(s)
    return SpreadsheetOut.model_validate(s)


@router.delete("/{spreadsheet_id}", status_code=204)
def delete_spreadsheet(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    repo.delete(s)


@router.get("/{spreadsheet_id}/schema", response_model=list[ColumnOut])
def get_schema(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    return [ColumnOut.model_validate(c) for c in s.columns]
