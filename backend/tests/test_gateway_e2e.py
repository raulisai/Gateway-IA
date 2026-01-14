import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app
from app.core.config import settings
from app.schemas.llm import GenerationResponse, GenerationUsage
from app.core.classifier.service import request_classifier
from app.schemas.classifier import ClassificationResult

@pytest.fixture(autouse=True)
def mock_classifier():
    with patch("app.api.v1.endpoints.gateway.request_classifier.analyze") as m:
        m.return_value = ClassificationResult(
            complexity="simple",
            tokens=10,
            detected_features=[],
            recommended_provider="openai",
            reasoning="Mocked for test"
        )
        yield m

@pytest.mark.asyncio
async def test_gateway_e2e_flow():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Setup: Create and login user
        email = "gateway-e2e@example.com"
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

        # 2. Mock Provider Execution
        # We mock execute_request at the manager level for simplicity in E2E
        mock_response = GenerationResponse(
            content="This is a test response from the intelligent gateway.",
            model_used="gpt-4o",
            usage=GenerationUsage(input_tokens=10, output_tokens=20, total_tokens=30),
            finish_reason="stop"
        )
        
        with patch("app.api.v1.endpoints.gateway.crud.provider_key.get_provider_keys_by_user") as mock_keys, \
             patch("app.api.v1.endpoints.gateway.provider_manager.execute_request", new_callable=AsyncMock) as mock_exec:
            
            mock_keys.return_value = [MagicMock(provider="openai")]
            mock_exec.return_value = mock_response
            
            # 3. Send Gateway Request
            payload = {
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Tell me a joke."}
                ],
                "max_tokens": 100,
                "routing_strategy": "balanced"
            }
            
            res = await ac.post(
                f"{settings.API_V1_STR}/chat/completions",
                json=payload,
                headers=headers
            )
            
            # 4. Assertions
            assert res.status_code == 200
            data = res.json()
            assert data["content"] == "This is a test response from the intelligent gateway."
            assert data["usage"]["total_tokens"] == 30
            
            # Verify the manager was called
            assert mock_exec.called
            # Verify classification and routing logic happened (implicitly by the fact we reached this point)
            
@pytest.mark.asyncio
async def test_gateway_error_handling_no_keys():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Setup: Create and login user
        email = "no-keys-user@example.com"
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

        # Don't mock execute_request, let it fail at key retrieval
        # Since the user hasn't added any keys, CRUD should return None and Manager should raise ValueError
        
        payload = {
            "messages": [{"role": "user", "content": "test"}],
            "routing_strategy": "cost"
        }
        
        res = await ac.post(
            f"{settings.API_V1_STR}/chat/completions",
            json=payload,
            headers=headers
        )
        
        # Should return 400 Bad Request due to no models available (no keys)
        assert res.status_code == 400
        assert "No models available" in res.json()["detail"]
