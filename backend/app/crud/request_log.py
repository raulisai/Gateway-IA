from sqlalchemy.orm import Session
from app.models.request_log import RequestLog
from app.schemas.request_log import RequestLogCreate
from typing import List

def create_request_log(db: Session, obj_in: RequestLogCreate) -> RequestLog:
    db_obj = RequestLog(
        user_id=obj_in.user_id,
        gateway_key_id=obj_in.gateway_key_id,
        endpoint=obj_in.endpoint,
        provider=obj_in.provider,
        model=obj_in.model,
        complexity=obj_in.complexity,
        prompt_tokens=obj_in.prompt_tokens,
        completion_tokens=obj_in.completion_tokens,
        total_tokens=obj_in.total_tokens,
        cost_usd=obj_in.cost_usd,
        latency_ms=obj_in.latency_ms,
        cache_hit=obj_in.cache_hit,
        status_code=obj_in.status_code,
        error_message=obj_in.error_message,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_logs_by_user(db: Session, user_id: str, limit: int = 100) -> List[RequestLog]:
    return db.query(RequestLog).filter(RequestLog.user_id == user_id).order_by(RequestLog.created_at.desc()).limit(limit).all()
