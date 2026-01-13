from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "LLM Gateway API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    MASTER_ENCRYPTION_KEY: str = os.getenv("MASTER_ENCRYPTION_KEY", "7u8U7z6T7v9T7r8Q7p6K7u8B7z6T7v9T7r8Q7p6K7u8=") # Placeholder 32-byte key

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
