from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional, Any

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    FUNCTION = "function"

class Message(BaseModel):
    role: MessageRole
    content: str
    name: Optional[str] = None

class GenerationRequest(BaseModel):
    messages: List[Message]
    model_id: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    stop_sequences: Optional[List[str]] = None

class GenerationUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int

class RoutingInfo(BaseModel):
    complexity_score: float
    complexity_level: str
    model_name: str
    provider: str
    reasoning: str
    proposed_models: List[Any] = Field(default_factory=list)


class GenerationResponse(BaseModel):
    content: str
    usage: Optional[GenerationUsage] = None
    model_used: str
    finish_reason: Optional[str] = None
    routing_info: Optional[RoutingInfo] = None
    provider_specific_response: Optional[Any] = Field(None, description="Raw response for debugging")

