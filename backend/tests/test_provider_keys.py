import pytest
from httpx import AsyncClient
from app.main import app
from app.core.config import settings
from unittest.mock import patch

@pytest.mark.asyncio
async def test_provider_keys_crud_flow():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Setup: Create and login user
        email = "providertest@example.com"
        password = "testpassword"
        await ac.post(
            f"{settings.API_V1_STR}/auth/signup",
            json={"email": email, "password": password}
        )
        login_res = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "password": password}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add Provider Key (Mocked Validation)
        provider = "openai"
        raw_key = "sk-proj-test-12345"
        
        with patch("app.api.v1.endpoints.provider_keys.validate_provider_key", return_value=True):
            create_res = await ac.post(
                f"{settings.API_V1_STR}/keys/providers/add",
                json={"provider": provider, "api_key": raw_key},
                headers=headers
            )
        
        assert create_res.status_code == 200
        data = create_res.json()
        assert data["provider"] == provider
        assert data["encrypted_key"] != raw_key
        provider_key_id = data["id"]

        # 3. List Provider Keys
        list_res = await ac.get(
            f"{settings.API_V1_STR}/keys/providers/list",
            headers=headers
        )
        assert list_res.status_code == 200
        assert any(k["provider"] == provider for k in list_res.json())
        
        # 4. Delete Provider Key
        del_res = await ac.delete(
            f"{settings.API_V1_STR}/keys/providers/{provider_key_id}",
            headers=headers
        )
        assert del_res.status_code == 200
        
        # 5. Verify deleted
        list_after = await ac.get(
            f"{settings.API_V1_STR}/keys/providers/list",
            headers=headers
        )
        assert all(k["id"] != provider_key_id for k in list_after.json())
