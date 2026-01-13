from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime

class ProviderKey(Base):
    __tablename__ = "provider_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False) # 'openai' | 'anthropic' | 'google'
    encrypted_key = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="provider_keys")
