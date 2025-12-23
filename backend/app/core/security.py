import logging
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException
from pwdlib import PasswordHash

from app.core.config import settings

logger = logging.getLogger(__name__)

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(username: str) -> str:
    try:
        token = jwt.encode(
            payload={
                'exp': datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS),
                'sub': username,
            },
            key=settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return token
    except Exception as e:
        logger.error(f'Ошибка при создании токена для пользователя {username}: {e}', exc_info=True)
        raise HTTPException(status_code=500, detail='Failed to create access token')


def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get('sub')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid credentials')
