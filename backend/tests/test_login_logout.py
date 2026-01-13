import pytest
from httpx import AsyncClient
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_login_and_logout():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Signup
        email = "login_test@example.com"
        password = "testpassword"
        await ac.post(
            f"{settings.API_V1_STR}/auth/signup",
            json={"email": email, "password": password}
        )

        # 2. Login
        login_response = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "password": password}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # 3. Access protected route (Implicitly tested by logout)
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Logout
        logout_response = await ac.post(
            f"{settings.API_V1_STR}/auth/logout",
            headers=headers
        )
        assert logout_response.status_code == 200
        assert logout_response.json()["message"] == "Successfully logged out"

        # 5. Verify token is now invalid
        invalid_response = await ac.post(
            f"{settings.API_V1_STR}/auth/logout",
            headers=headers
        )
        assert invalid_response.status_code == 401
        assert "revoked" in invalid_response.json()["detail"].lower()
