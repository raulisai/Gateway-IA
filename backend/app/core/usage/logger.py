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

    async def log_request(
        self,
        db: Session,
        *,
        user_id: str,
        gateway_key_id: Optional[str] = None, # Make optional for internal testing if needed
        endpoint: str,
        provider: str,
        model: str,
        complexity: str,
        usage: GenerationUsage,
        latency_ms: int,
        status_code: int = 200,
        error_message: Optional[str] = None,
        cache_hit: bool = False
    ) -> RequestLog:
        """
        Log a request to the database.
        """
        try:
            cost = self.calculate_cost(model, usage)
            
            # If gateway_key_id is missing (e.g. direct API usage), we might need a fallback or handle it
            # For now assuming it's passed or we use a dummy if appropriate, 
            # but model definition says nullable=False. 
            # We will handle it in the caller or here.
            
            log_entry = RequestLog(
                user_id=user_id,
                gateway_key_id=gateway_key_id if gateway_key_id else "direct-access", # Fallback or handle error
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
                error_message=error_message
            )
            
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Failed to log request usage: {str(e)}")
            # We don't want to fail the request if logging fails, just log the error
            return None

usage_logger = UsageLogger()
