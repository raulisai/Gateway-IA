from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional

class RoutingStrategy(str, Enum):
    COST = "cost"
    SPEED = "speed"
    QUALITY = "quality"
    BALANCED = "balanced"

class RoutingRequirements(BaseModel):
    input_tokens: int = Field(..., description="Estimated input tokens")
    max_output_tokens: Optional[int] = Field(None, description="Expected max output tokens")
    required_features: List[str] = Field(default_factory=list, description="Features required (e.g., 'json', 'image')")
    max_cost: Optional[float] = Field(None, description="Maximum cost constraint")
    provider_preference: Optional[str] = Field(None, description="Preferred provider")

class RoutingResult(BaseModel):
    selected_model_id: str
    fallback_models: List[str] = Field(default_factory=list)
    reasoning: str
    strategy_used: RoutingStrategy
