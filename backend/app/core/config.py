from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Путь к корню проекта (на 2 уровня выше от backend/app/core/)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


class Settings(BaseSettings):
    DB_URL: str = 'sqlite:///flips.db'

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_HOURS: int

    SOURCE_LANGUAGE: str = 'en'
    TARGET_LANGUAGE: str = 'ru'

    model_config = SettingsConfigDict(env_file=(PROJECT_ROOT / '.env', PROJECT_ROOT / '.env.template'))


settings = Settings()
