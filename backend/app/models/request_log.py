from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime, timezone

class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    gateway_key_id = Column(String, ForeignKey("gateway_keys.id"), nullable=False)
    endpoint = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    complexity = Column(String, nullable=False) # 'simple' | 'moderate' | 'complex' | 'expert'
    prompt_tokens = Column(Integer, nullable=False)
    completion_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    cost_usd = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    cache_hit = Column(Integer, default=0)
    status_code = Column(Integer, nullable=False)
    error_message = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="request_logs")
    gateway_key = relationship("GatewayKey", back_populates="request_logs")
