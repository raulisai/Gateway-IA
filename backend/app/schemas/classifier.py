from pydantic import BaseModel, Field
from typing import List, Optional

class ClassificationResult(BaseModel):
    complexity: str = Field(..., description="Complexity level: simple, moderate, complex, expert")
    tokens: int = Field(..., description="Estimated token count")
    detected_features: List[str] = Field(default_factory=list, description="Features detected in the prompt (e.g., code, sql, json)")
    recommended_provider: Optional[str] = Field(None, description="Recommended provider for this complexity")
    reasoning: Optional[str] = Field(None, description="Explanation for the classification")
