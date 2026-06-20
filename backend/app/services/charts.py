from __future__ import annotations

from typing import Any

from app.models.spreadsheet import SpreadsheetColumn


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
