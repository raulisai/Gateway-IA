import pytest
from httpx import AsyncClient
from app.main import app
from app.core.config import settings
import uuid

@pytest.mark.asyncio
async def test_signup():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Use unique email to avoid conflicts
        unique_email = f"newuser_{uuid.uuid4().hex[:8]}@example.com"
        user_data = {
            "email": unique_email,
            "password": "StrongPassword123"  # Updated: Meet password requirements
        }
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/signup",
            json=user_data
        )
    assert response.status_code == 201
    content = response.json()
    assert content["email"] == user_data["email"]
    assert "id" in content

@pytest.mark.asyncio
async def test_signup_duplicate():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        user_data = {
            "email": "duplicate@example.com",
            "password": "Password123"  # Updated: Meet password requirements
        }
        # First signup
        await ac.post(
            f"{settings.API_V1_STR}/auth/signup",
            json=user_data
        )
        # Duplicate signup
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/signup",
            json=user_data
        )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
