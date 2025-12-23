import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from app.core.config import settings
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Хэширует пароль используя bcrypt."""
    # Преобразуем пароль в bytes, если он строка
    password_bytes = password.encode('utf-8')
    # Генерируем соль и хэшируем пароль
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Возвращаем как строку
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль против хэша."""
    try:
        # Преобразуем в bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        # Проверяем пароль
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f'Ошибка при проверке пароля: {e}')
        return False


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
