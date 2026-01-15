from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.ALGORITHM

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

import secrets
import hashlib

def generate_gateway_key() -> str:
    """Generates a secure random key with gw_ prefix"""
    return f"gw_{secrets.token_urlsafe(32)}"

def hash_key(key: str) -> str:
    """Hashes a key using SHA-256"""
    return hashlib.sha256(key.encode()).hexdigest()

from cryptography.fernet import Fernet
import base64

class KeyVault:
    def __init__(self, master_key: str = None):
        if master_key is None:
            master_key = settings.MASTER_ENCRYPTION_KEY
        
        # Ensure key is valid for Fernet
        try:
            self.cipher = Fernet(master_key.encode())
        except Exception:
            # If invalid, fallback to a derived key or handle error
            # For now, we expect a valid base64 32-byte key
            raise ValueError("Invalid MASTER_ENCRYPTION_KEY format. Must be a 32-byte base64 encoded string.")

    def encrypt(self, plaintext: str) -> str:
        """Encrypts a string and returns a base64 encoded ciphertext"""
        if not plaintext:
            return ""
        return self.cipher.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypts a base64 encoded ciphertext and returns the plaintext"""
        if not ciphertext:
            return ""
        try:
            return self.cipher.decrypt(ciphertext.encode()).decode()
        except Exception:
            raise ValueError("Decryption failed: Invalid key or corrupted data")

# Global instance for easy use
key_vault = KeyVault()
