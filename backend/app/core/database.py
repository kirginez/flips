from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings
from app.models.entities import Card, History, Limits, Schedule  # noqa: F401

engine = create_engine(settings.DB_URL)


def init_db() -> None:
    """Инициализирует базу данных, создавая все таблицы."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
