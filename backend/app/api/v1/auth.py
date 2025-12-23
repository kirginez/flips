import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.core.security import create_access_token
from app.repositories.user import user_repo

logger = logging.getLogger(__name__)

router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


@router.post('/login', response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    try:
        logger.info(f'Попытка входа пользователя: {form_data.username}')
        user = user_repo.auth_user(form_data.username, form_data.password)
        token = create_access_token(user.username)
        logger.info(f'Токен успешно создан для пользователя: {user.username}')
        return Token(access_token=token, token_type='bearer')
    except HTTPException:
        # Перебрасываем HTTP исключения как есть
        raise
    except Exception as e:
        logger.error(f'Неожиданная ошибка при входе пользователя {form_data.username}: {e}', exc_info=True)
        raise HTTPException(status_code=500, detail='Internal server error')
