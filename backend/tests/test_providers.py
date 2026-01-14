import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import httpx
from app.core.providers.manager import provider_manager
from app.schemas.llm import GenerationRequest, Message, MessageRole
from app.core.providers.openai import OpenAIProvider
from app.core.providers.anthropic import AnthropicProvider

# MOCK DATA
MOCK_USER_ID = "test-user-id"
MOCK_API_KEY = "test-api-key"

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_get_key():
    with patch("app.core.providers.manager.crud.provider_key.get_decrypted_provider_key", return_value=MOCK_API_KEY) as m:
        yield m

@pytest.fixture
def mock_httpx():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m:
        yield m

# TEST OPENAI ADAPTER
@pytest.mark.asyncio
async def test_openai_adapter(mock_httpx):
    provider = OpenAIProvider()
    request = GenerationRequest(
        messages=[Message(role=MessageRole.USER, content="Hello")],
        model_id="gpt-4o"
    )
    
    # Mock Response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "chatcmpl-123",
        "choices": [{"message": {"content": "Hello there!"}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        "model": "gpt-4o-2024"
    }
    mock_httpx.return_value = mock_response
    
    response = await provider.generate(request, "key")
    
    assert response.content == "Hello there!"
    assert response.usage.total_tokens == 15
    assert response.model_used == "gpt-4o-2024"

# TEST ANTHROPIC ADAPTER
@pytest.mark.asyncio
async def test_anthropic_adapter(mock_httpx):
    provider = AnthropicProvider()
    request = GenerationRequest(
        messages=[Message(role=MessageRole.USER, content="Hi Claude")],
        model_id="claude-3-5-sonnet"
    )
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "msg_123",
        "content": [{"text": "Hello human"}],
        "stop_reason": "end_turn",
        "usage": {"input_tokens": 10, "output_tokens": 5}
    }
    mock_httpx.return_value = mock_response
    
    response = await provider.generate(request, "key")
    
    assert response.content == "Hello human"
    assert response.usage.total_tokens == 15

# TEST MANAGER FLOW
@pytest.mark.asyncio
async def test_manager_orchestration(mock_db, mock_get_key, mock_httpx):
    request = GenerationRequest(
        messages=[Message(role=MessageRole.USER, content="Test")],
        model_id="gpt-4o"
    )
    
    # Mock Internal Adapter Call (to skip rea httpx mock complexity inside manager if we wanted, 
    # but let's just mock httpx again since Manager calls Adapter calls httpx)
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Manager Result"}, "finish_reason": "stop"}],
        "model": "gpt-4o"
    }
    mock_httpx.return_value = mock_response
    
    result = await provider_manager.execute_request(mock_db, request, MOCK_USER_ID)
    
    assert result.content == "Manager Result"
    # Verify key lookup happened
    mock_get_key.assert_called_with(mock_db, user_id=MOCK_USER_ID, provider="openai")

