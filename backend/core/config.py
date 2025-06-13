# backend/core/config.py
import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "VisionGuard AI"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./visionguard.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # AI Services
    ANTHROPIC_API_KEY: str = ""

    # Video Processing
    MAX_CONCURRENT_STREAMS: int = 10
    FRAME_PROCESSING_INTERVAL: int = 5  # seconds
    VIDEO_STORAGE_PATH: str = "./data/videos"
    FRAME_STORAGE_PATH: str = "./data/frames"

    # Notifications
    ENABLE_EMAIL_NOTIFICATIONS: bool = False
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.VIDEO_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.FRAME_STORAGE_PATH, exist_ok=True)
