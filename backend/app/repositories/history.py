from sqlmodel import Session

from app.models.entities import History


class HistoryRepo:
    def __init__(self, db: Session):
        self.db = db

    def add_history(self, history: History) -> None:
        self.db.add(history)
        self.db.commit()
