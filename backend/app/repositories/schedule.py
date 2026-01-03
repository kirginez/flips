from datetime import date, datetime, timedelta

from app.models.entities import Card, CardStatus, Limits, Schedule, ScheduleAmount
from app.models.user import User
from sqlmodel import Session, func, select


class ScheduleRepo:
    def __init__(self, db: Session):
        self.db = db

    def add_card(self, card_id: str, username: str) -> None:
        stmt = select(Schedule).where(Schedule.card_id == card_id, Schedule.username == username)
        if not (self.db.exec(stmt).first()):
            self.db.add(Schedule(card_id=card_id, username=username))
            self.db.commit()

    def get_schedule(self, card_id: str, username: str) -> Schedule | None:
        stmt = select(Schedule).where(Schedule.card_id == card_id, Schedule.username == username)
        return self.db.exec(stmt).first() or None

    def get_new_amount(self, username: str) -> int:
        stmt = select(func.count(Schedule.id)).where(Schedule.username == username, Schedule.status == CardStatus.NEW)
        return self.db.exec(stmt).first()

    def get_cram_amount(self, username: str) -> int:
        stmt = select(func.count(Schedule.id)).where(Schedule.username == username, Schedule.status == CardStatus.CRAM)
        return self.db.exec(stmt).first()

    def get_due_amount(self, username: str) -> int:
        # Используем func.date() для извлечения даты из datetime и сравнения с текущей датой
        # func.date('now') возвращает текущую дату в SQLite
        stmt = select(func.count(Schedule.id)).where(
            Schedule.username == username,
            Schedule.status == CardStatus.DUE,
            func.date(Schedule.due) <= func.date('now'),
        )
        return self.db.exec(stmt).first()

    def get_amount(self, username: str) -> ScheduleAmount:
        new = self.get_new_amount(username)
        cram = self.get_cram_amount(username)
        due = self.get_due_amount(username)
        return ScheduleAmount(new=new, cram=cram, due=due)

    def get_limits(self, user: User) -> Limits:
        # В SQLite поле DATE хранится как строка 'YYYY-MM-DD', сравниваем напрямую
        today = date.today()
        stmt = select(Limits).where(Limits.username == user.username, Limits.created_at == today)
        if not (result := self.db.exec(stmt).first()):
            limits = Limits(username=user.username, new_limit=user.new_limit, due_limit=user.due_limit)
            self.db.add(limits)
            self.db.commit()
            self.db.refresh(limits)
            return limits
        return result

    def get_new(self, username: str) -> Schedule | None:
        stmt = (
            select(Schedule)
            .where(Schedule.username == username, Schedule.status == CardStatus.NEW)
            .order_by(func.random())
        )
        return self.db.exec(stmt).first() or None

    def get_cram(self, username: str) -> Schedule | None:
        stmt = (
            select(Schedule)
            .where(Schedule.username == username, Schedule.status == CardStatus.CRAM)
            .order_by(Schedule.due)
        )
        return self.db.exec(stmt).first() or None

    def get_due(self, username: str) -> Schedule | None:
        # Используем func.date() для извлечения даты из datetime и сравнения с текущей датой
        # func.date('now') возвращает текущую дату в SQLite
        stmt = (
            select(Schedule)
            .where(
                Schedule.username == username,
                Schedule.status == CardStatus.DUE,
                func.date(Schedule.due) <= func.date('now'),
            )
            .order_by(func.random())
        )
        return self.db.exec(stmt).first() or None

    def update_schedule(self, schedule: Schedule) -> None:
        self.db.add(schedule)
        self.db.commit()

    def update_limits(self, user: User, status: CardStatus | str, amount: int) -> None:
        limits = self.get_limits(user)
        # Поддерживаем как CardStatus enum, так и строки для обратной совместимости
        if isinstance(status, str):
            status = CardStatus(status)
        match status:
            case CardStatus.NEW:
                limits.new_limit += amount
            case CardStatus.DUE:
                limits.due_limit += amount
        self.db.add(limits)
        self.db.commit()

    def get_all_schedules(self, username: str) -> list[Schedule]:
        stmt = select(Schedule).where(Schedule.username == username)
        return list(self.db.exec(stmt).all())

    def delete_schedule(self, card_id: str, username: str) -> None:
        stmt = select(Schedule).where(Schedule.card_id == card_id, Schedule.username == username)
        schedule = self.db.exec(stmt).first()
        if schedule:
            self.db.delete(schedule)
            self.db.commit()

    def has_other_users(self, card_id: str, exclude_username: str) -> bool:
        stmt = select(Schedule).where(Schedule.card_id == card_id, Schedule.username != exclude_username)
        return self.db.exec(stmt).first() is not None

    def get_hardest_cards(self, username: str, limit: int = 10) -> list[dict]:
        stmt = (
            select(Schedule, Card)
            .join(Card, Schedule.card_id == Card.id)
            .where(Schedule.username == username)
            .order_by(Schedule.ease.asc())
            .limit(limit)
        )
        results = self.db.exec(stmt).all()
        return [
            {
                'card': {
                    'id': card.id,
                    'word': card.word,
                    'translation': card.translation,
                    'definition': card.definition,
                    'meta': card.meta,
                    'pronunciation': card.pronunciation,
                    'example': card.example,
                    'example_translation': card.example_translation,
                    'created_at': card.created_at.isoformat() if card.created_at else None,
                },
                'ease': schedule.ease,
            }
            for schedule, card in results
        ]

    def get_due_chart(self, username: str, days: int = 30) -> list[dict]:
        today = date.today()
        end_date = today + timedelta(days=days)
        stmt = (
            select(
                func.date(Schedule.due).label('day'),
                func.count(Schedule.id).label('count'),
            )
            .where(
                Schedule.username == username,
                Schedule.status == CardStatus.DUE,
                Schedule.due.isnot(None),
                func.date(Schedule.due) >= today,
                func.date(Schedule.due) <= end_date,
            )
            .group_by(func.date(Schedule.due))
            .order_by(func.date(Schedule.due))
        )
        results = self.db.exec(stmt).all()
        return [{'date': str(row.day), 'count': row.count} for row in results]
