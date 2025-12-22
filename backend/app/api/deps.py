import httpx
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import verify_token
from app.models.user import User
from app.repositories.cards import CardsRepo
from app.repositories.history import HistoryRepo
from app.repositories.reverso import HTTPReversoRepo
from app.repositories.schedule import ScheduleRepo
from app.repositories.user import UsersRepo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/login')


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    username = verify_token(token)
    return UsersRepo().get_user_by_username(username)


def get_httpx_client() -> httpx.Client:
    return httpx.Client()


def get_reverso_repo(client: httpx.Client = Depends(get_httpx_client)) -> HTTPReversoRepo:
    return HTTPReversoRepo(client)


def get_cards_repo(db: Session = Depends(get_session)) -> CardsRepo:
    return CardsRepo(db)


def get_schedule_repo(db: Session = Depends(get_session)) -> ScheduleRepo:
    return ScheduleRepo(db)


def get_history_repo(db: Session = Depends(get_session)) -> HistoryRepo:
    return HistoryRepo(db)
