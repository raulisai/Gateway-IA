import pytest
from httpx import AsyncClient
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_signup():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123"
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
            "password": "password123"
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
