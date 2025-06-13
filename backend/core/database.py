import logging
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, future=True)
async_session_maker = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()


class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String)
    url = Column(String, nullable=False)
    status = Column(String, default="offline")
    enabled = Column(Boolean, default=True)
    ai_enabled = Column(Boolean, default=True)
    motion_detection = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


async def create_tables():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Tables created")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except:
            await session.rollback()
            raise
        finally:
            await session.close()
