from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Spreadsheet(Base):
    __tablename__ = "spreadsheets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(512))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="processing")
    source_type: Mapped[str] = mapped_column(String(32), default="csv")
    share_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    owner = relationship("User", back_populates="spreadsheets")
    columns = relationship("SpreadsheetColumn", back_populates="spreadsheet", cascade="all, delete-orphan", order_by="SpreadsheetColumn.position")
    rows = relationship("Row", back_populates="spreadsheet", cascade="all, delete-orphan")


class SpreadsheetColumn(Base):
    __tablename__ = "spreadsheet_columns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    spreadsheet_id: Mapped[int] = mapped_column(ForeignKey("spreadsheets.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)
    inferred_type: Mapped[str] = mapped_column(String(32), default="string")
    enum_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    nullable: Mapped[bool] = mapped_column(Boolean, default=True)
    sample_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    stats: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    spreadsheet = relationship("Spreadsheet", back_populates="columns")
