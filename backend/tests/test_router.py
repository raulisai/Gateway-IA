import pytest
from unittest.mock import patch, MagicMock
from app.core.router.engine import routing_engine
from app.schemas.router import RoutingRequirements, RoutingStrategy
from app.schemas.registry import ModelDefinition

# Mock Data
MOCK_MODELS = [
    ModelDefinition(id="gpt-4o", provider="openai", original_model_id="gpt-4o", name="GPT-4o", cost_per_1k_input=0.005, cost_per_1k_output=0.015, context_window=100000, is_active=True),
    ModelDefinition(id="gpt-4o-mini", provider="openai", original_model_id="gpt-4o-mini", name="Mini", cost_per_1k_input=0.00015, cost_per_1k_output=0.0006, context_window=100000, is_active=True),
    ModelDefinition(id="claude-3-5-sonnet", provider="anthropic", original_model_id="claude-3-5", name="Sonnet", cost_per_1k_input=0.003, cost_per_1k_output=0.015, context_window=200000, is_active=True),
    ModelDefinition(id="gemini-flash", provider="google", original_model_id="gemini-flash", name="Flash", cost_per_1k_input=0.000075, cost_per_1k_output=0.0003, context_window=1000000, is_active=True),
]

@pytest.fixture
def mock_registry():
    with patch("app.core.router.engine.model_registry.list_models", return_value=MOCK_MODELS):
        yield

def test_router_filtering_context(mock_registry):
    # Requirement: 500k tokens (Only Gemini Flash fits)
    req = RoutingRequirements(input_tokens=500000)
    result = routing_engine.select_model(req)
    assert result.selected_model_id == "gemini-flash"

def test_router_filtering_preference(mock_registry):
    # Requirement: Prefer Anthropic
    req = RoutingRequirements(input_tokens=100, provider_preference="anthropic")
    result = routing_engine.select_model(req)
    assert result.selected_model_id == "claude-3-5-sonnet"

def test_router_strategy_cost(mock_registry):
    # Strategy: COST -> Should pick Gemini Flash or GPT-4o-mini (Flash is cheaper in mock)
    req = RoutingRequirements(input_tokens=100)
    result = routing_engine.select_model(req, strategy=RoutingStrategy.COST)
    # Flash is 0.000075 vs Mini 0.00015
    assert result.selected_model_id == "gemini-flash"

def test_router_strategy_quality(mock_registry):
    # Strategy: QUALITY -> Should pick GPT-4o or Sonnet
    req = RoutingRequirements(input_tokens=100)
    result = routing_engine.select_model(req, strategy=RoutingStrategy.QUALITY)
    # Heuristics might favor GPT-4o or Sonnet similarly, likely GPT-4o due to name match strength or sorting stability
    assert result.selected_model_id in ["gpt-4o", "claude-3-5-sonnet"]

def test_router_fallback_list(mock_registry):
    req = RoutingRequirements(input_tokens=100)
    result = routing_engine.select_model(req, strategy=RoutingStrategy.COST)
    # Ensure fallbacks are populated and sorted (cheapest first)
    assert len(result.fallback_models) == 3
    # Next cheapest is Mini
    assert result.fallback_models[0] == "gpt-4o-mini"
