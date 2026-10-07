from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.0 models."""
    pass


# Engine configuration tailored for Neon PostgreSQL serverless pooling
engine_kwargs = {
    "pool_pre_ping": True,  # Proactively test connections to handle Neon scale-to-zero drops
    "echo": settings.ENVIRONMENT == "development",
}

# Neon requires SSL in production. asyncpg supports ssl context or query param
if "neon.tech" in settings.DATABASE_URL and "ssl=" not in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"ssl": True}

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async database session per request.
    Rolls back automatically on unhandled exception and closes connection upon exit.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
