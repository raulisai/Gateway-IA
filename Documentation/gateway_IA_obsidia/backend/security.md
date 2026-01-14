---
tags:
  - backend
  - security
  - encryption
type: documentation
layer: backend
title: Seguridad
created: '2026-01-11'
---
# 🔐 Seguridad

> Implementación de seguridad del LLM Gateway.

## Visión General

```mermaid
graph TB
    subgraph "Security Layers"
        L1[Transport Security<br/>HTTPS/TLS]
        L2[Authentication<br/>JWT + API Keys]
        L3[Authorization<br/>RBAC]
        L4[Data Security<br/>Encryption at Rest]
    end
    
    L1 --> L2 --> L3 --> L4
```

## Autenticación

### JWT para Dashboard

```mermaid
sequenceDiagram
    User->>API: POST /auth/login
    API->>API: Validate credentials
    API->>API: Generate JWT
    API-->>User: {token: "eyJ..."}
    User->>API: GET /dashboard (Bearer token)
    API->>API: Validate JWT
    API-->>User: Protected resource
```

**JWT Structure:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "exp": 1704067200,
  "iat": 1704063600
}
```

### API Keys para Gateway

```mermaid
graph LR
    Key[gw_abc123...] --> Hash[SHA-256 Hash]
    Hash --> Store[(Database)]
    
    Request[Incoming Request] --> Extract[Extract Key]
    Extract --> HashCompare[Hash & Compare]
    HashCompare --> Lookup[(Database)]
```

**Key Format**: `gw_` + 32 random alphanumeric chars
**Storage**: Solo hash SHA-256, nunca plaintext

## Encriptación de Provider Keys

```mermaid
graph TB
    UserKey[Provider API Key] --> Encrypt[Fernet Encryption]
    MasterKey[Master Key<br/>from .env] --> KDF[PBKDF2 Key Derivation]
    KDF --> Encrypt
    Encrypt --> Store[(Encrypted in DB)]
    
    Store --> Decrypt[Fernet Decryption]
    KDF --> Decrypt
    Decrypt --> Use[Use for API calls]
```

### Implementation

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class KeyVault:
    def __init__(self, master_password: str):
        # Derive encryption key from master password
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=SALT,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> bytes:
        return self.cipher.encrypt(plaintext.encode())
    
    def decrypt(self, ciphertext: bytes) -> str:
        return self.cipher.decrypt(ciphertext).decode()
```

## Rate Limiting

```mermaid
graph TB
    Request --> Check{Under Limit?}
    Check -->|Yes| Process[Process Request]
    Check -->|No| Reject[429 Too Many Requests]
    Process --> Increment[Increment Counter]
    
    subgraph "Limits"
        PerKey[60 req/min per key]
        PerIP[100 req/min per IP]
    end
```

## Security Headers

```python
# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://llm-gateway.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers
{
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000",
    "Content-Security-Policy": "default-src 'self'"
}
```

## Best Practices

| Área | Implementación |
|------|----------------|
| Passwords | bcrypt con salt |
| Tokens | JWT con expiration corto |
| API Keys | Hash antes de almacenar |
| Provider Keys | AES-256 encryption |
| Transport | TLS 1.3 |
| Secrets | Environment variables |

---

*Ver también: [[../overview|Backend Overview]] | [[database|Database]]*
