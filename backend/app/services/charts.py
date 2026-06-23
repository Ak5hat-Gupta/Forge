from __future__ import annotations

from collections import Counter
from typing import Any

from app.models.spreadsheet import SpreadsheetColumn


def compute_chart_data(
    rows_data: list[dict[str, Any]],
    chart_type: str,
    x_column: str | None,
    y_column: str | None,
) -> dict[str, Any]:
    """Aggregate raw row dicts into the shape the dashboard renders
    (value/label for KPIs, points[] for bar/line/donut). Shared by the
    authenticated and public (share-token) chart endpoints."""
    if chart_type == "kpi" and y_column:
        nums: list[float] = []
        for r in rows_data:
            v = r.get(y_column)
            if v is None or v == "":
                continue
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
            "chart_type": "kpi", "column": y_column,
            "value": mean, "label": f"average · range {lo:,g}–{hi:,g} · n={count}",
            "count": count, "sum": total, "mean": mean, "min": lo, "max": hi,
        }

    if chart_type in ("bar", "line") and x_column and y_column:
        agg: dict[str, list[float]] = {}
        for r in rows_data:
            x_val = r.get(x_column)
            y_val = r.get(y_column)
            if x_val is None or y_val is None:
                continue
            try:
                y_num = float(y_val)
            except (ValueError, TypeError):
                continue
            agg.setdefault(str(x_val), []).append(y_num)
        points = [{"x": k, "y": round(sum(v) / len(v), 2)} for k, v in agg.items()]
        if chart_type == "line":
            points.sort(key=lambda d: d["x"])
        else:
            points.sort(key=lambda d: d["y"], reverse=True)
        return {"chart_type": chart_type, "x_column": x_column, "y_column": y_column, "points": points}

    if chart_type == "donut" and x_column:
        values = [str(r.get(x_column)) for r in rows_data if r.get(x_column) is not None]
        counts = Counter(values).most_common(10)
        return {"chart_type": "donut", "column": x_column, "points": [{"x": k, "y": v} for k, v in counts]}

    return {"chart_type": chart_type, "points": []}


def recommend_charts(columns: list[SpreadsheetColumn]) -> list[dict[str, Any]]:
    categoricals = [c for c in columns if c.inferred_type in ("string", "enum")]
    numerics = [c for c in columns if c.inferred_type in ("integer", "float", "currency")]
    dates = [c for c in columns if c.inferred_type == "date"]
    recommendations: list[dict[str, Any]] = []

    for num_col in numerics:
        recommendations.append({
            "chart_type": "kpi",
            "title": f"{num_col.name} Summary",
            "x_column": None,
            "y_column": num_col.slug,
            "priority": 1,
        })

    for date_col in dates:
        for num_col in numerics[:3]:
            recommendations.append({
                "chart_type": "line",
                "title": f"{num_col.name} over {date_col.name}",
                "x_column": date_col.slug,
                "y_column": num_col.slug,
                "priority": 2,
            })

    for cat_col in categoricals:
        unique = cat_col.stats.get("unique_count", 0) if cat_col.stats else 0
        if unique <= 20:
            for num_col in numerics[:2]:
                recommendations.append({
                    "chart_type": "bar",
                    "title": f"{num_col.name} by {cat_col.name}",
                    "x_column": cat_col.slug,
                    "y_column": num_col.slug,
                    "priority": 3,
                })

    for cat_col in categoricals:
        unique = cat_col.stats.get("unique_count", 0) if cat_col.stats else 0
        if unique <= 8:
            recommendations.append({
                "chart_type": "donut",
                "title": f"{cat_col.name} Distribution",
                "x_column": cat_col.slug,
                "y_column": None,
                "priority": 4,
            })

    return sorted(recommendations, key=lambda r: r["priority"])
