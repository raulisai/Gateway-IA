import pytest
from unittest.mock import MagicMock, AsyncMock
from app.core.usage.logger import usage_logger, PRICING
from app.schemas.llm import GenerationUsage

def test_calculate_cost():
    usage = GenerationUsage(input_tokens=1000, output_tokens=1000, total_tokens=2000)
    
    # Test configured model
    cost_gpt4 = usage_logger.calculate_cost("gpt-4", usage)
    expected_gpt4 = PRICING["gpt-4"]["input"] + PRICING["gpt-4"]["output"] # 0.03 + 0.06 = 0.09
    assert cost_gpt4 == pytest.approx(expected_gpt4)
    
    # Test fuzzy matching
    cost_gpt35 = usage_logger.calculate_cost("model-gpt-3.5-turbo-0125", usage)
    expected_gpt35 = PRICING["gpt-3.5-turbo"]["input"] + PRICING["gpt-3.5-turbo"]["output"]
    assert cost_gpt35 == pytest.approx(expected_gpt35)
    
    # Test default
    cost_unknown = usage_logger.calculate_cost("unknown-model", usage)
    expected_unknown = PRICING["default"]["input"] + PRICING["default"]["output"]
    assert cost_unknown == pytest.approx(expected_unknown)

@pytest.mark.asyncio
async def test_log_request():
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.commit = MagicMock()
    mock_db.refresh = MagicMock()
    
    usage = GenerationUsage(input_tokens=10, output_tokens=10, total_tokens=20)
    
    log = await usage_logger.log_request(
        mock_db,
        user_id="user1",
        gateway_key_id="key1",
        endpoint="/test",
        provider="openai",
        model="gpt-4",
        complexity="simple",
        usage=usage,
        latency_ms=100
    )
    
    assert log is not None
    assert log.user_id == "user1"
    assert log.cost_usd > 0
    assert log.total_tokens == 20
    
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
