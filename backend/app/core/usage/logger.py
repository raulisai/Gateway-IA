import logging
import uuid
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.request_log import RequestLog
from app.schemas.llm import GenerationUsage

logger = logging.getLogger(__name__)

# Basic pricing per 1k tokens (example values)
# In a real app, this might come from a DB or config file
PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    # Default fallback
    "default": {"input": 0.001, "output": 0.001}
}

class UsageLogger:
    def calculate_cost(self, model: str, usage: GenerationUsage) -> float:
        """
        Calculate cost in USD based on model and token usage.
        """
        # Simple fuzzy matching for model names
        model_key = "default"
        for key in PRICING:
            if key in model.lower():
                model_key = key
                break
        
        rates = PRICING.get(model_key, PRICING["default"])
        input_cost = (usage.input_tokens / 1000) * rates["input"]
        output_cost = (usage.output_tokens / 1000) * rates["output"]
        
        return round(input_cost + output_cost, 6)

    def _generate_auto_label(self, model: str, latency_ms: int, original_complexity: str) -> Dict[str, Any]:
        """
        Heuristic to guess the 'true' complexity for training data.
        """
        label = {
            "predicted_complexity": original_complexity,
            "actual_complexity": original_complexity, # Default match
            "discrepancy": False,
            "reason": "Matched"
        }
        
        # Rule 1: Model Choice Truth
        # If the router picked a strong model, it was likely complex
        if any(x in model.lower() for x in ["gpt-4o", "sonnet", "opus", "pro", "deepseek-reasoner"]):
            if original_complexity in ["simple", "moderate"]:
                label["actual_complexity"] = "complex"
                label["discrepancy"] = True
                label["reason"] = "Router escalated to strong model"
        
        # Rule 2: Model Choice Truth (Simple)
        # If the router picked a cheap model, it was likely simple
        elif any(x in model.lower() for x in ["flash", "mini", "haiku", "micro", "nano"]):
            if original_complexity in ["complex", "expert"]:
                label["actual_complexity"] = "moderate" # Downgrade
                label["discrepancy"] = True
                label["reason"] = "Router downgraded to cheap model"

        # Rule 3: Latency Check (Underestimation)
        # If classified simple but took > 10s, we probably missed something
        if latency_ms > 10000 and original_complexity == "simple":
            label["actual_complexity"] = "moderate"
            label["discrepancy"] = True
            label["reason"] = "High latency for simple task"
            
        # Rule 4: Latency Check (Overestimation)
        # If classified complex but took < 500ms, probably over-provisioned
        if latency_ms < 500 and original_complexity in ["complex", "expert"]:
            label["actual_complexity"] = "moderate"
            label["discrepancy"] = True
            label["reason"] = "Very low latency for complex task"
            
        return label

    async def log_request(
        self,
        db: Session,
        *,
        user_id: str,
        gateway_key_id: Optional[str] = None, 
        endpoint: str,
        provider: str,
        model: str,
        complexity: str,
        usage: GenerationUsage,
        latency_ms: int,
        status_code: int = 200,
        error_message: Optional[str] = None,
        cache_hit: bool = False,
        # New ML Data Fields
        classification_result: Optional[Any] = None,
        routing_result: Optional[Any] = None
    ) -> RequestLog:
        """
        Log a request to the database.
        """
        try:
            cost = self.calculate_cost(model, usage)
            
            # Prepare Meta Data for ML
            meta_data = {}
            if classification_result:
                meta_data["classification"] = {
                    "tokens": classification_result.tokens,
                    "features": classification_result.detected_features,
                    "recommended_provider": classification_result.recommended_provider,
                    "reasoning": classification_result.reasoning
                    # We could store base_score/multipliers if we exposed them in the result object
                    # For now, reasoning string contains them.
                }
            
            if routing_result:
                meta_data["routing"] = {
                    "selected": routing_result.selected_model_id,
                    "strategy": routing_result.strategy_used,
                    "fallbacks": routing_result.fallback_models
                }
                
            # Auto-Labeling
            if not error_message and status_code == 200:
                meta_data["auto_label"] = self._generate_auto_label(model, latency_ms, complexity)
            
            log_entry = RequestLog(
                user_id=user_id,
                gateway_key_id=gateway_key_id if gateway_key_id else "direct-access", 
                endpoint=endpoint,
                provider=provider,
                model=model,
                complexity=complexity,
                prompt_tokens=usage.input_tokens,
                completion_tokens=usage.output_tokens,
                total_tokens=usage.total_tokens,
                cost_usd=cost,
                latency_ms=latency_ms,
                cache_hit=1 if cache_hit else 0,
                status_code=status_code,
                error_message=error_message,
                meta_data=meta_data # Store the rich data
            )
            
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Failed to log request usage: {str(e)}")
            return None

usage_logger = UsageLogger()
