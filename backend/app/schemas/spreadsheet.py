from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ColumnOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    position: int
    inferred_type: str
    enum_values: list[str] | None = None
    nullable: bool
    sample_values: list[Any] | None = None
    stats: dict[str, Any] | None = None


class SpreadsheetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    filename: str
    row_count: int
    status: str
    source_type: str
    share_token: str | None = None
    created_at: datetime
    updated_at: datetime
    columns: list[ColumnOut] = []


class SpreadsheetListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    filename: str
    row_count: int
    status: str
    source_type: str
    created_at: datetime


class SpreadsheetUpdate(BaseModel):
    name: str | None = None
