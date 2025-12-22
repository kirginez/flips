from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel, UniqueConstraint


class CardStatus(Enum):
    NEW = 'N'
    CRAM = 'C'
    DUE = 'D'


class Card(SQLModel, table=True):
    id: str = Field(..., primary_key=True)
    word: str
    translation: str
    definition: str | None
    meta: str | None
    pronunciation: str | None
    example: str | None
    example_translation: str | None
    created_at: datetime = Field(default_factory=datetime.now)


class Schedule(SQLModel, table=True):
    __table_args__ = (UniqueConstraint('username', 'card_id', name='unique_username_card_id'),)

    id: int | None = Field(default=None, primary_key=True)
    username: str
    card_id: str
    ease: float = Field(default=2.5)
    due: datetime | None
    interval_min: int | None
    status: CardStatus = Field(default=CardStatus.NEW)
    created_at: datetime = Field(default_factory=datetime.now)


class History(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str
    card_id: str
    answer: bool
    created_at: datetime = Field(default_factory=datetime.now)


class Limits(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str
    new_limit: int
    due_limit: int
    created_at: date = Field(default_factory=date.today)


class ScheduleAmount(SQLModel):
    new: int = 0
    cram: int = 0
    due: int = 0


class Answer(SQLModel):
    card_id: str
    answer: bool


class IncreaseLimitsRequest(SQLModel):
    limit_type: str  # "NEW" или "DUE"
    amount: int  # количество карточек для добавления
