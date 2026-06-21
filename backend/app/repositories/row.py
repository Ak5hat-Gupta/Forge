from __future__ import annotations

from typing import Any

from sqlalchemy import func, select, cast, String, text
from sqlalchemy.orm import Session

from app.models.row import Row
from app.models.spreadsheet import SpreadsheetColumn
from app.repositories.base import BaseRepository


class RowRepository(BaseRepository[Row]):
    model = Row

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def query_rows(
        self,
        spreadsheet_id: int,
        columns: list[SpreadsheetColumn],
        search: str = "",
        filters: dict[str, Any] | None = None,
        sort_by: str | None = None,
        sort_dir: str = "asc",
        page: int = 1,
        per_page: int = 25,
    ) -> tuple[list[Row], int]:
        stmt = select(Row).where(Row.spreadsheet_id == spreadsheet_id)

        if search:
            string_cols = [c for c in columns if c.inferred_type in ("string", "email", "url")]
            if string_cols:
                search_conditions = []
                for col in string_cols:
                    search_conditions.append(
                        cast(Row.data[col.slug], String).ilike(f"%{search}%")
                    )
                from sqlalchemy import or_
                stmt = stmt.where(or_(*search_conditions))

        if filters:
            for key, value in filters.items():
                parts = key.split("__")
                if len(parts) == 2:
                    col_slug, op = parts
                else:
                    col_slug, op = parts[0], "eq"

                col_meta = next((c for c in columns if c.slug == col_slug), None)
                if not col_meta:
                    continue

                json_val = Row.data[col_slug]

                if op == "eq":
                    stmt = stmt.where(cast(json_val, String) == str(value))
                elif op == "ne":
                    stmt = stmt.where(cast(json_val, String) != str(value))
                elif op == "contains":
                    stmt = stmt.where(cast(json_val, String).ilike(f"%{value}%"))
                elif op in ("gt", "gte", "lt", "lte") and col_meta.inferred_type in ("integer", "float", "currency"):
                    cast_expr = cast(json_val, String)
                    if op == "gt":
                        stmt = stmt.where(cast_expr > str(value))
                    elif op == "gte":
                        stmt = stmt.where(cast_expr >= str(value))
                    elif op == "lt":
                        stmt = stmt.where(cast_expr < str(value))
                    elif op == "lte":
                        stmt = stmt.where(cast_expr <= str(value))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        if sort_by:
            order_col = cast(Row.data[sort_by], String)
            stmt = stmt.order_by(order_col.desc() if sort_dir == "desc" else order_col.asc())
        else:
            stmt = stmt.order_by(Row.row_index.asc())

        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        rows = list(self.db.execute(stmt).scalars().all())

        return rows, total

    def list_by_spreadsheet(self, spreadsheet_id: int, limit: int | None = None) -> list[Row]:
        stmt = select(Row).where(Row.spreadsheet_id == spreadsheet_id).order_by(Row.row_index.asc())
        if limit:
            stmt = stmt.limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def get_max_index(self, spreadsheet_id: int) -> int:
        result = self.db.execute(
            select(func.max(Row.row_index)).where(Row.spreadsheet_id == spreadsheet_id)
        ).scalar()
        return result or 0

    def delete_by_spreadsheet(self, spreadsheet_id: int) -> int:
        count = self.db.query(Row).filter(Row.spreadsheet_id == spreadsheet_id).delete()
        self.db.commit()
        return count
