import sys
import os
import asyncio
import json
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.core.usage.logger import usage_logger
from app.models.request_log import RequestLog
from app.schemas.llm import GenerationUsage
from app.schemas.classifier import ClassificationResult
from app.schemas.router import RoutingResult, RoutingStrategy

class MockDB:
    def __init__(self):
        self.added = []
    def add(self, obj):
        self.added.append(obj)
    def commit(self):
        pass
    def refresh(self, obj):
        pass

async def test_ml_logging():
    print("--- Testing ML Data Logging ---")
    
    db = MockDB()
    
    # Mock Objects
    classification = ClassificationResult(
        complexity="simple",
        tokens=15,
        detected_features=["greeting"],
        recommended_provider="google",
        reasoning="Base score..."
    )
    
    routing = RoutingResult(
        selected_model_id="gemini-1.5-flash",
        fallback_models=[],
        reasoning="Cheapest option",
        strategy_used=RoutingStrategy.COST
    )
    
    usage = GenerationUsage(input_tokens=15, output_tokens=10, total_tokens=25)
    
    # Scenario: Router picked cheap model for simple task -> Should match (No discrepancy)
    log = await usage_logger.log_request(
        db,
        user_id="test-user",
        endpoint="/test",
        provider="google",
        model="gemini-1.5-flash",
        complexity="simple",
        usage=usage,
        latency_ms=200, # Fast
        classification_result=classification,
        routing_result=routing
    )
    
    print("Log Entry Created:", log)
    print("Meta Data:", json.dumps(log.meta_data, indent=2))
    
    assert log.meta_data is not None
    assert log.meta_data["classification"]["recommended_provider"] == "google"
    assert log.meta_data["routing"]["selected"] == "gemini-1.5-flash"
    assert log.meta_data["auto_label"]["discrepancy"] is False
    print("✅ Normal Case Passed")

    # Scenario: Router picked cheap model but latency was huge -> Discrepancy
    log_slow = await usage_logger.log_request(
        db,
        user_id="test-user",
        endpoint="/test",
        provider="google",
        model="gemini-1.5-flash",
        complexity="simple",
        usage=usage,
        latency_ms=15000, # 15s latency for simple task!
        classification_result=classification,
        routing_result=routing
    )
    
    print("\nSlow Request Meta Data:", json.dumps(log_slow.meta_data, indent=2))
    assert log_slow.meta_data["auto_label"]["discrepancy"] is True
    assert log_slow.meta_data["auto_label"]["reason"] == "High latency for simple task"
    print("✅ Latency Discrepancy Passed")

if __name__ == "__main__":
    asyncio.run(test_ml_logging())
