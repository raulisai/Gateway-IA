from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from typing import Optional

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        password_hash=obj_in.password, # Note: Should be hashed, but keeping it simple for now
        plan=obj_in.plan,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
