import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.user import User
from app.crud.user import create_user, get_user_by_email
from app.crud.gateway_key import create_gateway_key
from app.crud.provider_key import create_provider_key
from app.schemas.user import UserCreate
from app.schemas.gateway_key import GatewayKeyCreate
from app.schemas.provider_key import ProviderKeyCreate

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_create_user(db_session):
    user_in = UserCreate(email="test@example.com", password="password123")
    user = create_user(db_session, user_in)
    assert user.email == "test@example.com"
    assert user.id is not None

def test_get_user_by_email(db_session):
    user_in = UserCreate(email="findme@example.com", password="password123")
    create_user(db_session, user_in)
    user = get_user_by_email(db_session, email="findme@example.com")
    assert user is not None
    assert user.email == "findme@example.com"

def test_relationships(db_session):
    # 1. Create User
    user_in = UserCreate(email="rel@example.com", password="password123")
    user = create_user(db_session, user_in)
    
    # 2. Create GatewayKey for User
    gw_in = GatewayKeyCreate(
        user_id=user.id, 
        key_hash="hash123", 
        prefix="gw_test", 
        name="Test Key"
    )
    gw_key = create_gateway_key(db_session, gw_in)
    
    # 3. Create ProviderKey for User
    prov_in = ProviderKeyCreate(
        user_id=user.id,
        provider="openai",
        encrypted_key="secret"
    )
    prov_key = create_provider_key(db_session, prov_in)
    
    # 4. Verify Relationships
    db_session.refresh(user)
    assert len(user.gateway_keys) == 1
    assert user.gateway_keys[0].id == gw_key.id
    assert len(user.provider_keys) == 1
    assert user.provider_keys[0].provider == "openai"
