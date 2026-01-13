from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GatewayKeyBase(BaseModel):
    name: Optional[str] = None
    rate_limit: Optional[int] = 100
    is_active: Optional[bool] = True

class GatewayKeyCreate(GatewayKeyBase):
    user_id: str
    key_hash: str
    prefix: str

class GatewayKeyUpdate(GatewayKeyBase):
    pass

class GatewayKeyInDBBase(GatewayKeyBase):
    id: str
    user_id: str
    key_hash: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GatewayKey(GatewayKeyInDBBase):
    pass
