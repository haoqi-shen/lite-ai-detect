from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .db import get_async_engine


_async_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    global _async_session_maker
    if _async_session_maker is None:
        engine = get_async_engine()
        _async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
    return _async_session_maker


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    maker = get_session_maker()
    async with maker() as session:
        yield session


