from typing import Any, List, Dict, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.api import deps
from app import models, schemas

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    days: int = 1
) -> Any:
    """
    Get aggregated analytics for the specified period (default 24h).
    """
    start_time = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Base query filter
    base_query = db.query(models.RequestLog).filter(
        models.RequestLog.user_id == current_user.id,
        models.RequestLog.created_at >= start_time
    )
    
    # Aggregations
    total_requests = base_query.count()
    if total_requests == 0:
        return {
            "total_requests": 0,
            "total_cost": 0.0,
            "avg_latency": 0.0,
            "total_tokens": 0,
            "cache_hit_rate": 0.0
        }

    total_cost = base_query.with_entities(func.sum(models.RequestLog.cost_usd)).scalar() or 0.0
    total_tokens = base_query.with_entities(func.sum(models.RequestLog.total_tokens)).scalar() or 0
    avg_latency = base_query.with_entities(func.avg(models.RequestLog.latency_ms)).scalar() or 0.0
    cache_hits = base_query.filter(models.RequestLog.cache_hit == 1).count()
    
    return {
        "total_requests": total_requests,
        "total_cost": round(total_cost, 6),
        "avg_latency": round(avg_latency, 2),
        "total_tokens": total_tokens,
        "cache_hit_rate": round(cache_hits / total_requests, 4)
    }

@router.get("/cost-breakdown")
async def get_cost_breakdown(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    days: int = 7
) -> Any:
    """
    Get daily cost breakdown for the last N days.
    """
    start_time = datetime.now(timezone.utc) - timedelta(days=days)
    
    # SQLite-specific date formatting might be tricky across DBs, 
    # but for typical SQL (Postgres/SQLite), we group by date.
    # Note: SQLite `date` function usage: func.date(models.RequestLog.created_at)
    
    daily_stats = db.query(
        func.date(models.RequestLog.created_at).label('date'),
        func.sum(models.RequestLog.cost_usd).label('cost'),
        func.count(models.RequestLog.id).label('requests')
    ).filter(
        models.RequestLog.user_id == current_user.id,
        models.RequestLog.created_at >= start_time
    ).group_by(
        func.date(models.RequestLog.created_at)
    ).order_by(
        func.date(models.RequestLog.created_at)
    ).all()
    
    return [
        {
            "date": stat.date,
            "cost": round(stat.cost, 6),
            "requests": stat.requests
        }
        for stat in daily_stats
    ]

@router.get("/model-distribution")
async def get_model_distribution(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    days: int = 7
) -> Any:
    """
    Get request count distribution by model.
    """
    start_time = datetime.now(timezone.utc) - timedelta(days=days)
    
    distribution = db.query(
        models.RequestLog.model,
        func.count(models.RequestLog.id).label('count')
    ).filter(
        models.RequestLog.user_id == current_user.id,
        models.RequestLog.created_at >= start_time
    ).group_by(
        models.RequestLog.model
    ).all()
    
    return [
        {"model": stat.model, "count": stat.count}
        for stat in distribution
    ]

@router.get("/requests", response_model=List[schemas.request_log.RequestLog])
async def get_recent_requests(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    limit: int = 20,
    offset: int = 0
) -> Any:
    """
    Get recent requests with details.
    """
    logs = db.query(models.RequestLog).filter(
        models.RequestLog.user_id == current_user.id
    ).order_by(
        desc(models.RequestLog.created_at)
    ).offset(offset).limit(limit).all()
    
    return logs
