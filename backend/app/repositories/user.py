import json
from pathlib import Path

from fastapi import HTTPException

from app.core.security import verify_password
from app.models.user import User


class UsersRepo:
    __path = Path('users.json')

    def auth_user(self, username: str, password: str) -> User:
        with open(self.__path, 'r') as f:
            users = json.load(f)
        for user in users:
            if user['username'] == username and verify_password(password, user['hashed_password']):
                return User.model_validate(user)
        raise HTTPException(status_code=401, detail='Invalid credentials')

    def get_user_by_username(self, username: str) -> User:
        with open(self.__path, 'r') as f:
            users = json.load(f)
        for user in users:
            if user['username'] == username:
                return User.model_validate(user)
        raise HTTPException(status_code=404, detail='User not found')


user_repo = UsersRepo()
