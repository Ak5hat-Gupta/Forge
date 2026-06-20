from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.spreadsheet import Spreadsheet
from app.repositories.base import BaseRepository


class SpreadsheetRepository(BaseRepository[Spreadsheet]):
    model = Spreadsheet

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_owner(self, owner_id: int) -> list[Spreadsheet]:
        return list(
            self.db.execute(
                select(Spreadsheet)
                .where(Spreadsheet.owner_id == owner_id)
                .order_by(Spreadsheet.created_at.desc())
            ).scalars().all()
        )

    def get_with_columns(self, id_: int) -> Spreadsheet | None:
        return self.db.execute(
            select(Spreadsheet)
            .where(Spreadsheet.id == id_)
            .options(selectinload(Spreadsheet.columns))
        ).scalar_one_or_none()

    def get_by_share_token(self, token: str) -> Spreadsheet | None:
        return self.db.execute(
            select(Spreadsheet)
            .where(Spreadsheet.share_token == token)
            .options(selectinload(Spreadsheet.columns))
        ).scalar_one_or_none()
