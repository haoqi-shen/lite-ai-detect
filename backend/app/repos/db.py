from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from ..config import get_settings


class Base(DeclarativeBase):
    pass


def get_async_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.DB_URL, echo=False, future=True)


