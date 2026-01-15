from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid

from app.crud.user import get_user_by_email, create_user, authenticate
from app.schemas.user import User, UserCreate, UserLogin
from app.schemas.auth import Token
from app.api.deps import get_db, get_current_user, reusable_oauth2
from app.core.security import create_access_token
from app.core.config import settings
from app.models.revoked_token import RevokedToken
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user_signup(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = create_user(db, obj_in=user_in)
    return user

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, retrieve an access token for future requests
    """
    user = authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
def login(
    user_in: UserLogin, db: Session = Depends(get_db)
) -> Any:
    """
    Generic login endpoint (JSON based)
    """
    user = authenticate(
        db, email=user_in.email, password=user_in.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
    token: str = Depends(reusable_oauth2)
) -> Any:
    """
    Invalidate the current token
    """
    # Check if already revoked
    existing = db.query(RevokedToken).filter(RevokedToken.token == token).first()
    if not existing:
        revoked_token = RevokedToken(id=str(uuid.uuid4()), token=token)
        db.add(revoked_token)
        db.commit()
    
    return {"message": "Successfully logged out"}
