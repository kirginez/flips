import logging
from datetime import datetime, timedelta, timezone

import jwt
from app.core.config import settings
from fastapi import HTTPException
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# Используем bcrypt для хеширования паролей (легче чем argon2)
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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
