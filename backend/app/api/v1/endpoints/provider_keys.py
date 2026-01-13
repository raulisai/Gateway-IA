from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

from app.core.providers.validator import validate_provider_key
from datetime import datetime, timezone

router = APIRouter()

@router.get("/list", response_model=List[schemas.provider_key.ProviderKey])
def list_provider_keys(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve all provider keys for the current user.
    """
    return crud.provider_key.get_provider_keys_by_user(db, user_id=current_user.id)

@router.post("/add", response_model=schemas.provider_key.ProviderKey)
async def add_provider_key(
    *,
    db: Session = Depends(deps.get_db),
    key_in: schemas.provider_key.ProviderKeyCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Add or update a provider API key with validation.
    """
    # 1. Validate key with provider
    is_valid = await validate_provider_key(key_in.provider, key_in.api_key)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid API key for provider {key_in.provider}"
        )

    # 2. Check if provider key already exists for user
    existing = db.query(models.ProviderKey).filter(
        models.ProviderKey.user_id == current_user.id,
        models.ProviderKey.provider == key_in.provider
    ).first()
    
    from app.core.security import key_vault
    
    if existing:
        # Update existing
        existing.encrypted_key = key_vault.encrypt(key_in.api_key)
        existing.last_verified_at = datetime.now(timezone.utc)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    
    # 3. Create new
    db_obj = crud.provider_key.create_provider_key(
        db, 
        user_id=current_user.id, 
        provider=key_in.provider, 
        raw_key=key_in.api_key
    )
    db_obj.last_verified_at = datetime.now(timezone.utc)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{provider_key_id}", response_model=schemas.provider_key.ProviderKey)
def delete_provider_key(
    *,
    db: Session = Depends(deps.get_db),
    provider_key_id: str,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Remove a provider API key.
    """
    db_obj = crud.provider_key.remove_provider_key(
        db, user_id=current_user.id, provider_key_id=provider_key_id
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail="Provider key not found")
    return db_obj
