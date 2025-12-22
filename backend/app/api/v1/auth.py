from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.core.security import create_access_token
from app.repositories.user import user_repo

router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


@router.post('/login', response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = user_repo.auth_user(form_data.username, form_data.password)
    token = create_access_token(user.username)
    return Token(access_token=token, token_type='bearer')
