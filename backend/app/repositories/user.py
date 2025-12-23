import json
import logging
from pathlib import Path

from app.core.security import verify_password
from app.models.user import User
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Путь к users.json относительно директории backend (где находится main.py)
BACKEND_DIR = Path(__file__).parent.parent.parent
USERS_FILE = BACKEND_DIR / 'users.json'

# Логируем путь при загрузке модуля для отладки
logger.info(f'Инициализация UsersRepo: путь к users.json = {USERS_FILE.absolute()}, существует = {USERS_FILE.exists()}')


class UsersRepo:
    __path = USERS_FILE

    def auth_user(self, username: str, password: str) -> User:
        try:
            if not self.__path.exists():
                logger.error(f'Файл users.json не найден по пути: {self.__path}')
                raise HTTPException(status_code=500, detail='Users file not found')

            with open(self.__path, 'r', encoding='utf-8') as f:
                users = json.load(f)

            for user in users:
                if user['username'] == username and verify_password(password, user['hashed_password']):
                    logger.info(f'Успешная аутентификация пользователя: {username}')
                    return User.model_validate(user)

            logger.warning(f'Неудачная попытка входа для пользователя: {username}')
            raise HTTPException(status_code=401, detail='Invalid credentials')
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Ошибка при аутентификации пользователя {username}: {e}', exc_info=True)
            raise HTTPException(status_code=500, detail='Internal server error')

    def get_user_by_username(self, username: str) -> User:
        try:
            if not self.__path.exists():
                logger.error(f'Файл users.json не найден по пути: {self.__path}')
                raise HTTPException(status_code=500, detail='Users file not found')

            with open(self.__path, 'r', encoding='utf-8') as f:
                users = json.load(f)

            for user in users:
                if user['username'] == username:
                    return User.model_validate(user)

            raise HTTPException(status_code=404, detail='User not found')
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Ошибка при получении пользователя {username}: {e}', exc_info=True)
            raise HTTPException(status_code=500, detail='Internal server error')


user_repo = UsersRepo()
