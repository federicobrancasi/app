import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "VisionGuard AI"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    SECRET_KEY: str = "change-me-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    DATABASE_URL: str = "sqlite+aiosqlite:///./visionguard.db"
    REDIS_URL: str = "redis://localhost:6379"

    ANTHROPIC_API_KEY: str = ""

    MAX_CONCURRENT_STREAMS: int = 10
    FRAME_PROCESSING_INTERVAL: int = 5
    VIDEO_STORAGE_PATH: str = "./data/videos"
    FRAME_STORAGE_PATH: str = "./data/frames"

    ENABLE_EMAIL_NOTIFICATIONS: bool = False
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# ensure directories exist
os.makedirs(settings.VIDEO_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.FRAME_STORAGE_PATH, exist_ok=True)
