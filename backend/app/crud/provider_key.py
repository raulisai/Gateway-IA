from sqlalchemy.orm import Session
from app.models.provider_key import ProviderKey
from app.schemas.provider_key import ProviderKeyCreate
from typing import List, Optional

from app.core.security import key_vault

def create_provider_key(db: Session, *, user_id: str, provider: str, raw_key: str) -> ProviderKey:
    db_obj = ProviderKey(
        user_id=user_id,
        provider=provider,
        encrypted_key=key_vault.encrypt(raw_key),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_provider_keys_by_user(db: Session, user_id: str) -> List[ProviderKey]:
    return db.query(ProviderKey).filter(ProviderKey.user_id == user_id).all()

def get_decrypted_provider_key(db: Session, user_id: str, provider: str) -> Optional[str]:
    db_obj = db.query(ProviderKey).filter(
        ProviderKey.user_id == user_id, 
        ProviderKey.provider == provider
    ).first()
    if db_obj:
        return key_vault.decrypt(db_obj.encrypted_key)
    return None
def remove_provider_key(db: Session, *, user_id: str, provider_key_id: str) -> Optional[ProviderKey]:
    db_obj = db.query(ProviderKey).filter(
        ProviderKey.id == provider_key_id,
        ProviderKey.user_id == user_id
    ).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
