from datetime import date, datetime, timedelta

from sqlmodel import Session, func, select

from app.models.entities import History


class HistoryRepo:
    def __init__(self, db: Session):
        self.db = db

    def add_history(self, history: History) -> None:
        self.db.add(history)
        self.db.commit()

    def get_today_stats(self, username: str) -> dict:
        today = date.today()
        stmt = select(
            func.count(History.id),
            func.min(History.created_at),
            func.max(History.created_at),
        ).where(
            History.username == username,
            func.date(History.created_at) == today,
        )
        result = self.db.exec(stmt).first()
        count, first_time, last_time = result if result else (0, None, None)
        return {
            'count': count,
            'first_time': first_time,
            'last_time': last_time,
        }

    def get_activity_data(self, username: str, days: int = 365) -> list[dict]:
        start_date = date.today() - timedelta(days=days - 1)
        stmt = (
            select(
                func.date(History.created_at).label('day'),
                func.count(History.id).label('count'),
            )
            .where(
                History.username == username,
                func.date(History.created_at) >= start_date,
            )
            .group_by(func.date(History.created_at))
            .order_by(func.date(History.created_at))
        )
        results = self.db.exec(stmt).all()
        return [{'date': str(row.day), 'count': row.count} for row in results]
