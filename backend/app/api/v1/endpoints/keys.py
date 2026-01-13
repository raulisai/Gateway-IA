from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[schemas.gateway_key.GatewayKey])
def read_keys(
    db: Session = Depends(deps.get_db),
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve all gateway keys for the current user.
    """
    return crud.gateway_key.get_keys_by_user(db, user_id=current_user.id)

@router.post("/", response_model=schemas.gateway_key.GatewayKeyCreated)
def create_key(
    *,
    db: Session = Depends(deps.get_db),
    key_in: schemas.gateway_key.GatewayKeyCreate,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new gateway key.
    """
    raw_key = security.generate_gateway_key()
    key_hash = security.hash_key(raw_key)
    prefix = raw_key[:10]  # e.g., gw_abc123
    
    db_obj = crud.gateway_key.create_gateway_key(
        db, obj_in=key_in, user_id=current_user.id, key_hash=key_hash, prefix=prefix
    )
    
    return {
        "id": db_obj.id,
        "key": raw_key,
        "prefix": db_obj.prefix,
        "name": db_obj.name,
        "rate_limit": db_obj.rate_limit,
        "is_active": db_obj.is_active,
        "created_at": db_obj.created_at
    }

@router.delete("/{key_id}", response_model=schemas.gateway_key.GatewayKey)
def delete_key(
    *,
    db: Session = Depends(deps.get_db),
    key_id: str,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a gateway key.
    """
    key = crud.gateway_key.get_gateway_key(db, key_id=key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    if key.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    return crud.gateway_key.remove_gateway_key(db, key_id=key_id)
