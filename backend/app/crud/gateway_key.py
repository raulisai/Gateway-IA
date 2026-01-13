from sqlalchemy.orm import Session
from app.models.gateway_key import GatewayKey
from app.schemas.gateway_key import GatewayKeyCreate
from typing import List, Optional

def get_gateway_key_by_hash(db: Session, key_hash: str) -> Optional[GatewayKey]:
    return db.query(GatewayKey).filter(GatewayKey.key_hash == key_hash).first()

def create_gateway_key(
    db: Session, *, obj_in: GatewayKeyCreate, user_id: str, key_hash: str, prefix: str
) -> GatewayKey:
    db_obj = GatewayKey(
        user_id=user_id,
        key_hash=key_hash,
        prefix=prefix,
        name=obj_in.name,
        rate_limit=obj_in.rate_limit,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_keys_by_user(db: Session, user_id: str) -> List[GatewayKey]:
    return db.query(GatewayKey).filter(GatewayKey.user_id == user_id).all()

def get_gateway_key(db: Session, key_id: str) -> Optional[GatewayKey]:
    return db.query(GatewayKey).filter(GatewayKey.id == key_id).first()

def remove_gateway_key(db: Session, key_id: str) -> Optional[GatewayKey]:
    key = db.query(GatewayKey).filter(GatewayKey.id == key_id).first()
    if key:
        db.delete(key)
        db.commit()
    return key
