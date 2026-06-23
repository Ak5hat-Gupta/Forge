from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.repositories import RowRepository, SpreadsheetRepository
from app.services.charts import compute_chart_data, recommend_charts

router = APIRouter(prefix="/spreadsheets/{spreadsheet_id}/charts", tags=["charts"])


@router.get("/recommend")
def get_recommendations(
    spreadsheet_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")
    return recommend_charts(list(s.columns))


@router.get("/data")
def get_chart_data(
    spreadsheet_id: int,
    chart_type: str = Query(...),
    x_column: str | None = Query(None),
    y_column: str | None = Query(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    repo = SpreadsheetRepository(db)
    s = repo.get_with_columns(spreadsheet_id)
    if not s or s.owner_id != current.id:
        raise HTTPException(status_code=404, detail="Spreadsheet not found.")

    rows, _ = RowRepository(db).query_rows(
        spreadsheet_id=s.id, columns=list(s.columns), per_page=10000,
    )
    return compute_chart_data([r.data for r in rows], chart_type, x_column, y_column)
