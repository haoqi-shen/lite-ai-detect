from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    APP_ENV: str = "local"

    AWS_REGION: str = "us-west-2"
    S3_BUCKET: str = ""

    DB_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/liteaidetect"
    REDIS_URL: str = "redis://localhost:6379/0"

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_ISSUER: str = ""

    # Optional: allow stubbing storage in local
    ENABLE_STORAGE_STUB: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


