from pydantic import BaseModel, Field
from typing import Optional, List

class ModelDefinition(BaseModel):
    id: str = Field(..., description="Unique internal identifier for the model (e.g., gpt-4o)")
    provider: str = Field(..., description="Provider name (openai, anthropic, google)")
    original_model_id: str = Field(..., description="The ID used by the provider API")
    name: str = Field(..., description="Human-readable name")
    description: Optional[str] = None
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0
    context_window: int = 0
    is_active: bool = True

class ModelList(BaseModel):
    models: List[ModelDefinition]
