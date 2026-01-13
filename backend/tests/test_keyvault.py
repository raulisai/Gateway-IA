import pytest
from app.core.security import KeyVault, key_vault
from cryptography.fernet import Fernet

def test_keyvault_encryption_decryption():
    test_key = Fernet.generate_key().decode()
    vault = KeyVault(master_key=test_key)
    
    original_text = "sk-proj-abc123xyz789"
    encrypted = vault.encrypt(original_text)
    
    assert encrypted != original_text
    assert len(encrypted) > len(original_text)
    
    decrypted = vault.decrypt(encrypted)
    assert decrypted == original_text

def test_keyvault_invalid_decryption():
    test_key = Fernet.generate_key().decode()
    vault = KeyVault(master_key=test_key)
    
    assert vault.decrypt("invalid-ciphertext") == "Decryption error: Invalid key or corrupted data"

def test_global_keyvault_instance():
    # Test that the global instance works with the default key from settings
    secret = "my-secret-provider-key"
    encrypted = key_vault.encrypt(secret)
    decrypted = key_vault.decrypt(encrypted)
    assert decrypted == secret

def test_empty_values():
    assert key_vault.encrypt("") == ""
    assert key_vault.decrypt("") == ""
