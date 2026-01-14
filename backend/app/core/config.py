from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
import secrets
import base64

def get_secret_key() -> str:
    """Get SECRET_KEY from environment or generate a secure one for development"""
    key = os.getenv("SECRET_KEY")
    if key:
        return key
    # For development only - generate a secure random key
    if os.getenv("ENVIRONMENT", "development") == "development":
        return secrets.token_urlsafe(32)
    raise ValueError("SECRET_KEY must be set in production environment")

def get_master_encryption_key() -> str:
    """Get MASTER_ENCRYPTION_KEY from environment or generate one for development"""
    key = os.getenv("MASTER_ENCRYPTION_KEY")
    if key:
        return key
    # For development only - generate a valid Fernet key
    if os.getenv("ENVIRONMENT", "development") == "development":
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    raise ValueError("MASTER_ENCRYPTION_KEY must be set in production environment")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

    PROJECT_NAME: str = "LLM Gateway API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Security - Required in production, auto-generated in development
    SECRET_KEY: str = get_secret_key()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    MASTER_ENCRYPTION_KEY: str = get_master_encryption_key()

settings = Settings()
