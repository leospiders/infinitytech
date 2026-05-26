from functools import lru_cache
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

@lru_cache
def _get_engine():
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_async_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )

@lru_cache
def _Session():
    return async_sessionmaker(
        bind=_get_engine(),
        class_=AsyncSession,
        expire_on_commit=False
    )

async def get_db():
    session = _Session()()
    try:
        yield session
    finally:
        await session.close()
