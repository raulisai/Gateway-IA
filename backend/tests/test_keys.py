import pytest
from httpx import AsyncClient
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_gateway_keys_crud_flow():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Setup: Create and login user
        email = "keytest@example.com"
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

        # 2. Create Key
        create_res = await ac.post(
            f"{settings.API_V1_STR}/keys/",
            json={"name": "Test Key", "rate_limit": 50},
            headers=headers
        )
        assert create_res.status_code == 200
        key_data = create_res.json()
        assert "key" in key_data
        assert key_data["key"].startswith("gw_")
        key_id = key_data["id"]

        # 3. List Keys
        list_res = await ac.get(
            f"{settings.API_V1_STR}/keys/",
            headers=headers
        )
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1
        assert list_res.json()[0]["id"] == key_id

        # 4. Delete Key
        del_res = await ac.delete(
            f"{settings.API_V1_STR}/keys/{key_id}",
            headers=headers
        )
        assert del_res.status_code == 200

        # 5. Verify deleted
        list_res_after = await ac.get(
            f"{settings.API_V1_STR}/keys/",
            headers=headers
        )
        assert all(k["id"] != key_id for k in list_res_after.json())
