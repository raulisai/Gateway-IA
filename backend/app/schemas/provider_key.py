from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProviderKeyBase(BaseModel):
    provider: str
    is_active: Optional[bool] = True

class ProviderKeyCreate(ProviderKeyBase):
    api_key: str

class ProviderKeyUpdate(ProviderKeyBase):
    api_key: Optional[str] = None

class ProviderKeyInDBBase(ProviderKeyBase):
    id: str
    user_id: str
    encrypted_key: str
    created_at: datetime
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProviderKey(ProviderKeyInDBBase):
    pass
