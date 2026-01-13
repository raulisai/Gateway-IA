from sqlalchemy.orm import Session
from app.models.provider_key import ProviderKey
from app.schemas.provider_key import ProviderKeyCreate
from typing import List, Optional

def create_provider_key(db: Session, obj_in: ProviderKeyCreate) -> ProviderKey:
    db_obj = ProviderKey(
        user_id=obj_in.user_id,
        provider=obj_in.provider,
        encrypted_key=obj_in.encrypted_key,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_provider_keys_by_user(db: Session, user_id: str) -> List[ProviderKey]:
    return db.query(ProviderKey).filter(ProviderKey.user_id == user_id).all()
