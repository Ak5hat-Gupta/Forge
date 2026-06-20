from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Row(Base):
    __tablename__ = "rows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    spreadsheet_id: Mapped[int] = mapped_column(ForeignKey("spreadsheets.id", ondelete="CASCADE"), index=True)
    row_index: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    spreadsheet = relationship("Spreadsheet", back_populates="rows")

    __table_args__ = (
        Index("ix_rows_spreadsheet_index", "spreadsheet_id", "row_index"),
    )
