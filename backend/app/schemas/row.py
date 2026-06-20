from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class RowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    spreadsheet_id: int
    row_index: int
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class RowCreate(BaseModel):
    data: dict[str, Any]


class RowUpdate(BaseModel):
    data: dict[str, Any]


class PaginatedRows(BaseModel):
    rows: list[RowOut]
    total: int
    page: int
    per_page: int
    pages: int
