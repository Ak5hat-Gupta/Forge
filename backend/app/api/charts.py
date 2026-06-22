from __future__ import annotations

from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.repositories import RowRepository, SpreadsheetRepository
from app.services.charts import recommend_charts

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

    row_repo = RowRepository(db)
    rows, _ = row_repo.query_rows(
        spreadsheet_id=s.id,
        columns=list(s.columns),
        per_page=10000,
    )

    if chart_type == "kpi" and y_column:
        values = [r.data.get(y_column) for r in rows if r.data.get(y_column) is not None]
        nums = []
        for v in values:
            try:
                nums.append(float(v))
            except (ValueError, TypeError):
                continue
        count = len(nums)
        total = round(sum(nums), 2) if nums else 0
        mean = round(sum(nums) / count, 2) if nums else 0
        lo = round(min(nums), 2) if nums else 0
        hi = round(max(nums), 2) if nums else 0
        return {
            "chart_type": "kpi",
            "column": y_column,
            # `value` + `label` are what the dashboard card renders.
            "value": mean,
            "label": f"average · range {lo:,g}–{hi:,g} · n={count}",
            "count": count,
            "sum": total,
            "mean": mean,
            "min": lo,
            "max": hi,
        }

    if chart_type in ("bar", "line") and x_column and y_column:
        points: list[dict[str, Any]] = []
        agg: dict[str, list[float]] = {}
        for r in rows:
            x_val = r.data.get(x_column)
            y_val = r.data.get(y_column)
            if x_val is None or y_val is None:
                continue
            try:
                y_num = float(y_val)
            except (ValueError, TypeError):
                continue
            key = str(x_val)
            agg.setdefault(key, []).append(y_num)

        for k, vals in agg.items():
            points.append({"x": k, "y": round(sum(vals) / len(vals), 2)})

        if chart_type == "line":
            points.sort(key=lambda d: d["x"])
        else:
            points.sort(key=lambda d: d["y"], reverse=True)

        return {"chart_type": chart_type, "x_column": x_column, "y_column": y_column, "points": points}

    if chart_type == "donut" and x_column:
        values = [str(r.data.get(x_column)) for r in rows if r.data.get(x_column) is not None]
        counts = Counter(values).most_common(10)
        # Dashboard donut reads points[].x (label) and points[].y (value).
        return {
            "chart_type": "donut",
            "column": x_column,
            "points": [{"x": k, "y": v} for k, v in counts],
        }

    return {"chart_type": chart_type, "points": []}
