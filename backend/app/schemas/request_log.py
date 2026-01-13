from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RequestLogBase(BaseModel):
    endpoint: str
    provider: str
    model: str
    complexity: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: int
    cache_hit: Optional[int] = 0
    status_code: int
    error_message: Optional[str] = None

class RequestLogCreate(RequestLogBase):
    user_id: str
    gateway_key_id: str

class RequestLogInDBBase(RequestLogBase):
    id: str
    user_id: str
    gateway_key_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class RequestLog(RequestLogInDBBase):
    pass
