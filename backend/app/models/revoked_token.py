from sqlalchemy import Column, String, DateTime
from app.db.session import Base
from datetime import datetime, timezone

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(String, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
