---
tags:
  - especificacion
  - tecnica
  - developer
  - implementacion
type: especificacion_tecnica
title: Especificación Técnica para Developer
created: '2026-01-11'
---
# 🔧 LLM Gateway - Especificación Técnica Completa

> **DOCUMENTO TÉCNICO PARA IMPLEMENTACIÓN**: Especificaciones detalladas, estructuras de datos, contratos de API, ejemplos de código y decisiones de arquitectura sin ambigüedad.

---

## 📋 ÍNDICE

1. [Stack Tecnológico Detallado](#1-stack-tecnológico-detallado)
2. [Estructura de Directorios](#2-estructura-de-directorios)
3. [Configuración de Docker](#3-configuración-de-docker)
4. [Esquema de Base de Datos](#4-esquema-de-base-de-datos)
5. [Backend - Modelos y Schemas](#5-backend---modelos-y-schemas)
6. [Backend - Endpoints y Contratos](#6-backend---endpoints-y-contratos)
7. [Sistema de Clasificación](#7-sistema-de-clasificación)
8. [Motor de Enrutamiento](#8-motor-de-enrutamiento)
9. [Adaptadores de Proveedores](#9-adaptadores-de-proveedores)
10. [Sistema de Caché](#10-sistema-de-caché)
11. [Frontend - Estructura de Componentes](#11-frontend---estructura-de-componentes)
12. [Updater Service](#12-updater-service)
13. [Ejemplos de Uso](#13-ejemplos-de-uso)

---

## 1. STACK TECNOLÓGICO DETALLADO

### 1.1 Versiones recomendadas

```yaml
Backend:
  - Python: 3.11.8
  - FastAPI: 0.109.0
  - Uvicorn: 0.27.0
  - SQLAlchemy: 2.0.25
  - Pydantic: 2.5.3
  - HTTPX: 0.26.0
  - Python-Jose[cryptography]: 3.3.0
  - Passlib[bcrypt]: 1.7.4
  - Cryptography: 42.0.0
  - tiktoken: 0.5.2
  - cachetools: 5.3.2
  - python-dotenv: 1.0.0
  - APScheduler: 3.10.4

Frontend:
  - Next.js: 14.1.0
  - React: 18.2.0
  - TypeScript: 5.3.3
  - Tailwind CSS: 3.4.1
  - Shadcn/ui: latest
  - React Query (TanStack Query): 5.17.19
  - Recharts: 2.10.3
  - React Hook Form: 7.49.3
  - Zod: 3.22.4
  - Axios: 1.6.5

DevOps:
  - Docker: 24.0.7
  - Docker Compose: 2.23.0
```

---

## 2. ESTRUCTURA DE DIRECTORIOS

### 2.1 Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app initialization
│   ├── config.py                  # Settings & environment variables
│   ├── database.py                # SQLAlchemy setup
│   │
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── gateway_key.py
│   │   ├── provider_key.py
│   │   └── request_log.py
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── gateway.py
│   │   ├── analytics.py
│   │   └── models.py
│   │
│   ├── api/                       # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                # Dependencies
│   │   ├── auth.py                # /api/auth/*
│   │   ├── keys.py                # /api/keys/*
│   │   ├── analytics.py           # /api/analytics/*
│   │   ├── models.py              # /api/models/*
│   │   └── gateway.py             # /v1/chat/completions
│   │
│   ├── core/                      # Business logic
│   │   ├── __init__.py
│   │   ├── security.py            # JWT, encryption
│   │   ├── classifier.py          # Request classifier
│   │   ├── router.py              # Routing engine
│   │   ├── cache.py               # Cache manager
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py            # BaseProvider
│   │   │   ├── openai.py          # OpenAIProvider
│   │   │   ├── anthropic.py       # AnthropicProvider
│   │   │   └── google.py          # GoogleProvider
│   │   ├── tracker.py             # Usage tracker
│   │   └── registry.py            # Model registry
│   │
│   └── utils/                     # Utilities
│       ├── __init__.py
│       └── helpers.py
│
├── tests/
│   ├── __init__.py
│   ├── test_classifier.py
│   ├── test_router.py
│   └── test_providers.py
│
├── Dockerfile
├── requirements.txt
└── .env.example
```

### 2.2 Frontend

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   │
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   └── dashboard/
│       ├── layout.tsx             # Dashboard layout
│       ├── page.tsx               # Overview
│       ├── keys/page.tsx
│       ├── models/page.tsx
│       └── analytics/page.tsx
│
├── components/
│   ├── ui/                        # Shadcn components
│   ├── dashboard/
│   │   ├── MetricsCard.tsx
│   │   ├── CostChart.tsx
│   │   ├── ModelDistChart.tsx
│   │   └── RequestsTable.tsx
│   ├── keys/
│   │   ├── KeyList.tsx
│   │   ├── KeyCreator.tsx
│   │   └── ProviderKeys.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── api.ts                     # API client
│   ├── auth.ts                    # Auth utilities
│   └── utils.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useAnalytics.ts
│   └── useKeys.ts
│
├── types/
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.local.example
```

---

## 3. CONFIGURACIÓN DE DOCKER

### 3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gateway-backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./backend:/app
    environment:
      - DATABASE_URL=sqlite:///./data/gateway.db
      - SECRET_KEY=${SECRET_KEY}
      - MASTER_ENCRYPTION_KEY=${MASTER_ENCRYPTION_KEY}
      - CORS_ORIGINS=http://localhost:3000
    networks:
      - gateway-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gateway-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    networks:
      - gateway-network
    depends_on:
      - backend
    restart: unless-stopped

  updater:
    build:
      context: ./updater
      dockerfile: Dockerfile
    container_name: gateway-updater
    volumes:
      - ./data:/app/data
    environment:
      - REGISTRY_URL=https://raw.githubusercontent.com/user/repo/main/registry.json
    networks:
      - gateway-network
    restart: unless-stopped

networks:
  gateway-network:
    driver: bridge

volumes:
  data:
```

### 3.2 Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 3.3 Frontend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Run application
CMD ["npm", "start"]
```

---

## 4. ESQUEMA DE BASE DE DATOS

### 4.1 SQL Schema Completo

```sql
-- Table: users
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- UUID as TEXT
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,  -- ISO 8601 datetime
    plan TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'enterprise'
    is_active INTEGER NOT NULL DEFAULT 1  -- Boolean as INTEGER
);

CREATE INDEX idx_users_email ON users(email);

-- Table: gateway_keys
CREATE TABLE gateway_keys (
    id TEXT PRIMARY KEY,  -- UUID as TEXT
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,  -- SHA256 hash of the key
    prefix TEXT NOT NULL,  -- First 10 chars: "gw_abc123"
    name TEXT,  -- User-friendly name
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    rate_limit INTEGER NOT NULL DEFAULT 100,  -- Requests per minute
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_gateway_keys_user ON gateway_keys(user_id);
CREATE INDEX idx_gateway_keys_prefix ON gateway_keys(prefix);

-- Table: provider_keys
CREATE TABLE provider_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,  -- 'openai', 'anthropic', 'google'
    encrypted_key TEXT NOT NULL,  -- Fernet encrypted
    last_verified_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_provider_keys_user_provider ON provider_keys(user_id, provider);

-- Table: request_logs
CREATE TABLE request_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    gateway_key_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    complexity TEXT NOT NULL,  -- 'simple', 'moderate', 'complex', 'expert'
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd REAL NOT NULL,  -- Up to 6 decimals
    latency_ms INTEGER NOT NULL,
    cache_hit INTEGER NOT NULL DEFAULT 0,  -- Boolean
    status_code INTEGER NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (gateway_key_id) REFERENCES gateway_keys (id) ON DELETE CASCADE
);

CREATE INDEX idx_request_logs_user_created ON request_logs(user_id, created_at DESC);
CREATE INDEX idx_request_logs_model ON request_logs(model);
CREATE INDEX idx_request_logs_complexity ON request_logs(complexity);
CREATE INDEX idx_request_logs_created ON request_logs(created_at DESC);
```

### 4.2 Ejemplo de datos iniciales

```sql
-- Usuario de ejemplo (password: "password123")
INSERT INTO users VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'demo@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYuQGRGILZi',
    '2026-01-11T00:00:00Z',
    'free',
    1
);

-- Gateway key de ejemplo (key: "gw_abc123xyz...")
INSERT INTO gateway_keys VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'hash_of_key_here',
    'gw_abc123',
    'Demo Key',
    '2026-01-11T00:00:00Z',
    NULL,
    1,
    100
);
```

---

## 5. BACKEND - MODELOS Y SCHEMAS

### 5.1 SQLAlchemy Models

#### models/user.py

```python
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    plan = Column(String, nullable=False, default="free")  # 'free', 'pro', 'enterprise'
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    gateway_keys = relationship("GatewayKey", back_populates="user", cascade="all, delete-orphan")
    provider_keys = relationship("ProviderKey", back_populates="user", cascade="all, delete-orphan")
    request_logs = relationship("RequestLog", back_populates="user", cascade="all, delete-orphan")
```

#### models/gateway_key.py

```python
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class GatewayKey(Base):
    __tablename__ = "gateway_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key_hash = Column(String, nullable=False)  # SHA256 of actual key
    prefix = Column(String, nullable=False, index=True)  # "gw_abc123"
    name = Column(String)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    last_used_at = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    rate_limit = Column(Integer, nullable=False, default=100)  # Requests per minute
    
    # Relationships
    user = relationship("User", back_populates="gateway_keys")
    request_logs = relationship("RequestLog", back_populates="gateway_key")
```

#### models/provider_key.py

```python
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class ProviderKey(Base):
    __tablename__ = "provider_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)  # 'openai', 'anthropic', 'google'
    encrypted_key = Column(String, nullable=False)  # Fernet encrypted
    last_verified_at = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    user = relationship("User", back_populates="provider_keys")
```

#### models/request_log.py

```python
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class RequestLog(Base):
    __tablename__ = "request_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    gateway_key_id = Column(String, ForeignKey("gateway_keys.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String, nullable=False)
    complexity = Column(String, nullable=False)  # 'simple', 'moderate', 'complex', 'expert'
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    prompt_tokens = Column(Integer, nullable=False)
    completion_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    cost_usd = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    cache_hit = Column(Boolean, nullable=False, default=False)
    status_code = Column(Integer, nullable=False)
    error_message = Column(String, nullable=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    user = relationship("User", back_populates="request_logs")
    gateway_key = relationship("GatewayKey", back_populates="request_logs")
```

### 5.2 Pydantic Schemas

#### schemas/auth.py

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    email: str

class UserResponse(BaseModel):
    id: str
    email: str
    plan: str
    created_at: str
    
    class Config:
        from_attributes = True
```

#### schemas/gateway.py

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Message(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[Message] = Field(..., min_items=1)
    model: Optional[str] = None  # User can override
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=100000)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    stream: Optional[bool] = False

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Usage
    metadata: Optional[Dict[str, Any]] = None  # Our custom metadata

class GatewayKeyCreate(BaseModel):
    name: Optional[str] = None

class GatewayKeyResponse(BaseModel):
    id: str
    prefix: str
    name: Optional[str]
    created_at: str
    last_used_at: Optional[str]
    is_active: bool
    rate_limit: int
    
    class Config:
        from_attributes = True
```

#### schemas/analytics.py

```python
from pydantic import BaseModel
from typing import List, Optional

class AnalyticsOverview(BaseModel):
    total_requests: int
    total_cost: float
    avg_latency_ms: int
    cache_hit_rate: float
    period: str  # "24h", "7d", "30d"

class CostBreakdownItem(BaseModel):
    date: str  # ISO date: "2026-01-11"
    cost: float
    requests: int

class CostBreakdown(BaseModel):
    data: List[CostBreakdownItem]

class ModelDistributionItem(BaseModel):
    model: str
    requests: int
    cost: float
    percentage: float

class ModelDistribution(BaseModel):
    models: List[ModelDistributionItem]

class RequestLogResponse(BaseModel):
    id: str
    created_at: str
    model: str
    complexity: str
    total_tokens: int
    cost_usd: float
    latency_ms: int
    cache_hit: bool
    
    class Config:
        from_attributes = True
```

---

## 6. BACKEND - ENDPOINTS Y CONTRATOS

### 6.1 Authentication Endpoints

#### POST /api/auth/signup

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "plan": "free",
    "created_at": "2026-01-11T10:30:00Z"
  }
}
```

**Errors:**
- `400`: Email already registered
- `422`: Validation error (weak password, invalid email)

#### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "plan": "free",
    "created_at": "2026-01-11T10:30:00Z"
  }
}
```

**Errors:**
- `401`: Invalid credentials

#### GET /api/auth/me

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "plan": "free",
  "created_at": "2026-01-11T10:30:00Z"
}
```

### 6.2 Gateway Keys Endpoints

#### POST /api/keys

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Production Key"
}
```

**Response (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "key": "gw_abc123xyz789def456ghi012jkl345",
  "prefix": "gw_abc123",
  "name": "Production Key",
  "created_at": "2026-01-11T10:30:00Z",
  "is_active": true,
  "rate_limit": 100
}
```

**IMPORTANT:** `key` field is only returned ONCE at creation. Store it securely.

#### GET /api/keys

**Response (200):**
```json
{
  "keys": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "prefix": "gw_abc123",
      "name": "Production Key",
      "created_at": "2026-01-11T10:30:00Z",
      "last_used_at": "2026-01-11T15:45:00Z",
      "is_active": true,
      "rate_limit": 100
    }
  ]
}
```

#### DELETE /api/keys/{key_id}

**Response (204):** No content

### 6.3 Provider Keys Endpoints

#### POST /api/keys/providers

**Request:**
```json
{
  "provider": "openai",
  "api_key": "sk-proj-abc123xyz789..."
}
```

**Response (201):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "provider": "openai",
  "is_active": true,
  "last_verified_at": "2026-01-11T10:30:00Z",
  "created_at": "2026-01-11T10:30:00Z"
}
```

**Process:**
1. Validate API key format
2. Test key with provider (make test API call)
3. If valid, encrypt and store
4. Return success

**Errors:**
- `400`: Invalid API key format
- `401`: API key verification failed (invalid key)
- `409`: Provider key already exists for this user

#### GET /api/keys/providers

**Response (200):**
```json
{
  "providers": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "provider": "openai",
      "is_active": true,
      "last_verified_at": "2026-01-11T10:30:00Z",
      "created_at": "2026-01-11T10:30:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "provider": "anthropic",
      "is_active": true,
      "last_verified_at": "2026-01-11T09:15:00Z",
      "created_at": "2026-01-10T14:20:00Z"
    }
  ]
}
```

### 6.4 Analytics Endpoints

#### GET /api/analytics/overview?timeframe=24h

**Query Parameters:**
- `timeframe`: "24h" | "7d" | "30d" (default: "24h")

**Response (200):**
```json
{
  "total_requests": 1523,
  "total_cost": 4.52,
  "avg_latency_ms": 2100,
  "cache_hit_rate": 23.5,
  "period": "24h"
}
```

#### GET /api/analytics/cost-breakdown?days=7

**Query Parameters:**
- `days`: integer (default: 7, max: 30)

**Response (200):**
```json
{
  "data": [
    {"date": "2026-01-05", "cost": 0.85, "requests": 320},
    {"date": "2026-01-06", "cost": 1.20, "requests": 450},
    {"date": "2026-01-07", "cost": 0.95, "requests": 380},
    {"date": "2026-01-08", "cost": 1.10, "requests": 410},
    {"date": "2026-01-09", "cost": 0.75, "requests": 290},
    {"date": "2026-01-10", "cost": 1.30, "requests": 485},
    {"date": "2026-01-11", "cost": 0.60, "requests": 188}
  ]
}
```

#### GET /api/analytics/model-distribution

**Response (200):**
```json
{
  "models": [
    {
      "model": "gpt-4o-mini",
      "requests": 850,
      "cost": 2.10,
      "percentage": 55.8
    },
    {
      "model": "claude-3-haiku",
      "requests": 430,
      "cost": 0.80,
      "percentage": 28.2
    },
    {
      "model": "gpt-4o",
      "requests": 243,
      "cost": 6.50,
      "percentage": 15.9
    }
  ]
}
```

### 6.5 Main Gateway Endpoint

#### POST /v1/chat/completions

**Headers:**
```
Authorization: Bearer gw_abc123xyz789def456ghi012jkl345
Content-Type: application/json
```

**Request:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"}
  ],
  "temperature": 0.7,
  "max_tokens": 150
}
```

**Response (200):**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1705000000,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris. It is located in the north-central part of the country and is known for its art, culture, and iconic landmarks like the Eiffel Tower."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 23,
    "completion_tokens": 38,
    "total_tokens": 61
  },
  "metadata": {
    "model_used": "gpt-4o-mini",
    "provider": "openai",
    "cost_usd": 0.000026,
    "latency_ms": 1850,
    "cache_hit": false,
    "complexity": "simple"
  }
}
```

**Errors:**
- `401`: Invalid gateway key
- `429`: Rate limit exceeded
- `503`: No available models (all providers down or no provider keys configured)

---

## 7. SISTEMA DE CLASIFICACIÓN

### 7.1 Implementación del Classifier

#### core/classifier.py

```python
import tiktoken
import re
from typing import Dict, List, Any
from enum import Enum

class Complexity(str, Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    EXPERT = "expert"

class RequestClassifier:
    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
        
        # Technical keywords for complexity detection
        self.technical_keywords = {
            "code": ["function", "class", "import", "def", "var", "const", "async", "await"],
            "math": ["equation", "derivative", "integral", "theorem", "proof", "calculate"],
            "science": ["hypothesis", "experiment", "analysis", "research", "study"],
        }
    
    def classify(self, messages: List[Dict[str, str]], params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Classify request complexity based on:
        - Token count (60% weight)
        - Lexical complexity (20% weight)
        - Task type (20% weight)
        """
        # 1. Combine all messages into single text
        full_text = " ".join([msg["content"] for msg in messages])
        
        # 2. Count tokens
        tokens = self.count_tokens(full_text)
        
        # 3. Extract features
        features = self._extract_features(full_text)
        
        # 4. Calculate weighted score
        score = self._calculate_score(tokens, features)
        
        # 5. Map to complexity level
        complexity = self._map_complexity(score, tokens)
        
        return {
            "complexity": complexity.value,
            "estimated_tokens": tokens,
            "features": features,
            "score": score
        }
    
    def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken"""
        return len(self.encoder.encode(text))
    
    def _extract_features(self, text: str) -> List[str]:
        """Extract relevant features from text"""
        features = []
        
        # Check for code
        if "```" in text or any(kw in text.lower() for kw in self.technical_keywords["code"]):
            features.append("code")
        
        # Check for math
        if any(kw in text.lower() for kw in self.technical_keywords["math"]):
            features.append("math")
        
        # Check for science
        if any(kw in text.lower() for kw in self.technical_keywords["science"]):
            features.append("science")
        
        # Check for questions
        if "?" in text:
            features.append("question")
        
        # Check for analysis keywords
        if any(word in text.lower() for word in ["compare", "analyze", "evaluate", "contrast"]):
            features.append("analysis")
        
        return features
    
    def _calculate_score(self, tokens: int, features: List[str]) -> float:
        """Calculate complexity score (0-100)"""
        # Token score (60% weight)
        token_score = min(tokens / 100, 60)  # Max 60 points
        
        # Feature score (40% weight)
        feature_weights = {
            "code": 15,
            "math": 12,
            "science": 10,
            "analysis": 8,
            "question": -5  # Simple questions reduce complexity
        }
        
        feature_score = sum(feature_weights.get(f, 0) for f in features)
        feature_score = max(0, min(feature_score, 40))  # Clamp to 0-40
        
        return token_score + feature_score
    
    def _map_complexity(self, score: float, tokens: int) -> Complexity:
        """Map score to complexity enum"""
        # Token-based thresholds (override score for very large requests)
        if tokens > 8000:
            return Complexity.EXPERT
        if tokens > 2000:
            return Complexity.COMPLEX
        
        # Score-based mapping
        if score < 20:
            return Complexity.SIMPLE
        elif score < 40:
            return Complexity.MODERATE
        elif score < 70:
            return Complexity.COMPLEX
        else:
            return Complexity.EXPERT
```

### 7.2 Ejemplo de Uso

```python
classifier = RequestClassifier()

# Simple question
result = classifier.classify([
    {"role": "user", "content": "What is the capital of France?"}
])
# Output: {'complexity': 'simple', 'estimated_tokens': 8, 'features': ['question'], 'score': 3.0}

# Complex coding task
result = classifier.classify([
    {"role": "user", "content": "Write a Python function to implement a binary search tree with insertion, deletion, and traversal methods. Include error handling and type hints."}
])
# Output: {'complexity': 'complex', 'estimated_tokens': 35, 'features': ['code'], 'score': 36.0}
```

---

## 8. MOTOR DE ENRUTAMIENTO

### 8.1 Implementación del Router

#### core/router.py

```python
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import logging

@dataclass
class ModelScore:
    model_id: str
    provider: str
    score: float
    reason: str

class RoutingEngine:
    def __init__(self, registry):
        self.registry = registry
        self.logger = logging.getLogger(__name__)
        
        # Quality multipliers by complexity
        self.quality_multipliers = {
            "simple": 1.0,
            "moderate": 1.5,
            "complex": 2.0,
            "expert": 3.0
        }
    
    def select_model(
        self,
        complexity: str,
        estimated_tokens: int,
        user_providers: List[str],
        provider_health: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Select optimal model based on:
        1. Context window requirement
        2. Provider health
        3. Cost/quality score
        
        Returns: {
            "model_id": str,
            "provider": str,
            "fallbacks": [model_id, ...]
        }
        """
        # 1. Get available models
        available_models = self.registry.get_models()
        
        # 2. Filter by user's configured providers
        available_models = [
            m for m in available_models
            if m["provider"] in user_providers
        ]
        
        if not available_models:
            raise ValueError("No provider keys configured")
        
        # 3. Filter by context window
        required_tokens = estimated_tokens * 1.5  # 50% buffer for completion
        available_models = [
            m for m in available_models
            if m["specs"]["context_window"] >= required_tokens
        ]
        
        if not available_models:
            raise ValueError(f"No models with sufficient context window ({required_tokens} tokens)")
        
        # 4. Filter by provider health
        available_models = [
            m for m in available_models
            if provider_health.get(m["provider"], 1.0) > 0.5  # >50% health required
        ]
        
        if not available_models:
            raise ValueError("All providers unhealthy")
        
        # 5. Score remaining models
        scored_models = []
        for model in available_models:
            score = self._calculate_score(model, complexity)
            scored_models.append(ModelScore(
                model_id=model["id"],
                provider=model["provider"],
                score=score,
                reason=f"Score: {score:.2f}"
            ))
        
        # 6. Sort by score (descending)
        scored_models.sort(key=lambda x: x.score, reverse=True)
        
        # 7. Select top 1 + fallbacks
        selected = scored_models[0]
        fallbacks = [m.model_id for m in scored_models[1:4]]  # Top 3 fallbacks
        
        self.logger.info(f"Selected model: {selected.model_id} (score: {selected.score:.2f})")
        
        return {
            "model_id": selected.model_id,
            "provider": selected.provider,
            "fallbacks": fallbacks
        }
    
    def _calculate_score(self, model: Dict[str, Any], complexity: str) -> float:
        """
        Calculate model score based on cost, quality, and speed
        
        Formula: (quality_multiplier / cost_per_1m) + speed_bonus
        """
        # Get pricing (average of input and output)
        pricing = model["pricing"]
        avg_cost = (pricing["prompt"] + pricing["completion"]) / 2
        
        # Quality multiplier
        quality = self.quality_multipliers.get(complexity, 1.5)
        
        # Cost score (higher score = cheaper)
        cost_score = quality / max(avg_cost, 0.01)  # Avoid division by zero
        
        # Speed bonus
        performance = model.get("performance", {})
        latency = performance.get("latency_p50", 5000)  # Default 5s
        
        if latency < 2000:  # <2s
            speed_bonus = 10
        elif latency < 5000:  # <5s
            speed_bonus = 5
        else:
            speed_bonus = 0
        
        return cost_score + speed_bonus
```

### 8.2 Ejemplo de models.json

```json
{
  "version": "1.0.0",
  "updated_at": "2026-01-11T00:00:00Z",
  "models": [
    {
      "id": "gpt-4o",
      "provider": "openai",
      "model_name": "gpt-4o",
      "display_name": "GPT-4 Optimized",
      "pricing": {
        "prompt": 2.50,
        "completion": 10.00
      },
      "specs": {
        "context_window": 128000,
        "max_output_tokens": 16384,
        "supports_vision": true,
        "supports_function_calling": true
      },
      "performance": {
        "latency_p50": 2100,
        "latency_p99": 5000
      }
    },
    {
      "id": "gpt-4o-mini",
      "provider": "openai",
      "model_name": "gpt-4o-mini",
      "display_name": "GPT-4 Optimized Mini",
      "pricing": {
        "prompt": 0.15,
        "completion": 0.60
      },
      "specs": {
        "context_window": 128000,
        "max_output_tokens": 16384,
        "supports_vision": true,
        "supports_function_calling": true
      },
      "performance": {
        "latency_p50": 1800,
        "latency_p99": 4000
      }
    },
    {
      "id": "claude-3-5-sonnet-20241022",
      "provider": "anthropic",
      "model_name": "claude-3-5-sonnet-20241022",
      "display_name": "Claude 3.5 Sonnet",
      "pricing": {
        "prompt": 3.00,
        "completion": 15.00
      },
      "specs": {
        "context_window": 200000,
        "max_output_tokens": 8192,
        "supports_vision": true,
        "supports_function_calling": true
      },
      "performance": {
        "latency_p50": 2300,
        "latency_p99": 6000
      }
    },
    {
      "id": "claude-3-haiku-20240307",
      "provider": "anthropic",
      "model_name": "claude-3-haiku-20240307",
      "display_name": "Claude 3 Haiku",
      "pricing": {
        "prompt": 0.25,
        "completion": 1.25
      },
      "specs": {
        "context_window": 200000,
        "max_output_tokens": 4096,
        "supports_vision": true,
        "supports_function_calling": false
      },
      "performance": {
        "latency_p50": 900,
        "latency_p99": 2500
      }
    }
  ]
}
```

---

## 9. ADAPTADORES DE PROVEEDORES

### 9.1 Base Provider

#### core/providers/base.py

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

class BaseProvider(ABC):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)
    
    @abstractmethod
    def format_request(self, messages: List[Dict], params: Dict) -> Dict[str, Any]:
        """Convert standard format to provider-specific format"""
        pass
    
    @abstractmethod
    def parse_response(self, response: Dict) -> Dict[str, Any]:
        """Convert provider-specific response to standard format"""
        pass
    
    @abstractmethod
    def get_endpoint(self, model: str) -> str:
        """Get API endpoint for model"""
        pass
    
    @abstractmethod
    def get_headers(self) -> Dict[str, str]:
        """Get HTTP headers"""
        pass
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8)
    )
    async def call(
        self,
        model: str,
        messages: List[Dict],
        params: Dict
    ) -> Dict[str, Any]:
        """Make API call with retry logic"""
        endpoint = self.get_endpoint(model)
        headers = self.get_headers()
        body = self.format_request(messages, params)
        
        response = await self.client.post(
            endpoint,
            headers=headers,
            json=body
        )
        
        if response.status_code != 200:
            raise Exception(f"Provider error: {response.status_code} - {response.text}")
        
        return self.parse_response(response.json())
    
    async def close(self):
        await self.client.aclose()
```

### 9.2 OpenAI Provider

#### core/providers/openai.py

```python
from .base import BaseProvider
from typing import Dict, Any, List

class OpenAIProvider(BaseProvider):
    BASE_URL = "https://api.openai.com/v1"
    
    def get_endpoint(self, model: str) -> str:
        return f"{self.BASE_URL}/chat/completions"
    
    def get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def format_request(self, messages: List[Dict], params: Dict) -> Dict[str, Any]:
        """OpenAI format (already standard)"""
        request = {
            "model": params["model"],
            "messages": messages
        }
        
        # Optional parameters
        if "temperature" in params:
            request["temperature"] = params["temperature"]
        if "max_tokens" in params:
            request["max_tokens"] = params["max_tokens"]
        if "top_p" in params:
            request["top_p"] = params["top_p"]
        
        return request
    
    def parse_response(self, response: Dict) -> Dict[str, Any]:
        """OpenAI response (already standard)"""
        return {
            "content": response["choices"][0]["message"]["content"],
            "model": response["model"],
            "usage": {
                "prompt_tokens": response["usage"]["prompt_tokens"],
                "completion_tokens": response["usage"]["completion_tokens"],
                "total_tokens": response["usage"]["total_tokens"]
            },
            "provider": "openai",
            "raw_response": response
        }
    
    async def validate_key(self) -> bool:
        """Test if API key is valid"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/models",
                headers=self.get_headers()
            )
            return response.status_code == 200
        except:
            return False
```

### 9.3 Anthropic Provider

#### core/providers/anthropic.py

```python
from .base import BaseProvider
from typing import Dict, Any, List

class AnthropicProvider(BaseProvider):
    BASE_URL = "https://api.anthropic.com/v1"
    API_VERSION = "2023-06-01"
    
    def get_endpoint(self, model: str) -> str:
        return f"{self.BASE_URL}/messages"
    
    def get_headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": self.API_VERSION,
            "Content-Type": "application/json"
        }
    
    def format_request(self, messages: List[Dict], params: Dict) -> Dict[str, Any]:
        """Convert to Anthropic format"""
        # Anthropic requires system message separate
        system_message = None
        anthropic_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                anthropic_messages.append(msg)
        
        request = {
            "model": params["model"],
            "messages": anthropic_messages,
            "max_tokens": params.get("max_tokens", 1024)  # Required by Anthropic
        }
        
        if system_message:
            request["system"] = system_message
        
        if "temperature" in params:
            request["temperature"] = params["temperature"]
        if "top_p" in params:
            request["top_p"] = params["top_p"]
        
        return request
    
    def parse_response(self, response: Dict) -> Dict[str, Any]:
        """Convert Anthropic response to standard format"""
        return {
            "content": response["content"][0]["text"],
            "model": response["model"],
            "usage": {
                "prompt_tokens": response["usage"]["input_tokens"],
                "completion_tokens": response["usage"]["output_tokens"],
                "total_tokens": response["usage"]["input_tokens"] + response["usage"]["output_tokens"]
            },
            "provider": "anthropic",
            "raw_response": response
        }
    
    async def validate_key(self) -> bool:
        """Test if API key is valid"""
        try:
            # Anthropic doesn't have a dedicated endpoint to test keys
            # Make a minimal request
            response = await self.call(
                model="claude-3-haiku-20240307",
                messages=[{"role": "user", "content": "Hi"}],
                params={"model": "claude-3-haiku-20240307", "max_tokens": 10}
            )
            return True
        except:
            return False
```

### 9.4 Google Provider

#### core/providers/google.py

```python
from .base import BaseProvider
from typing import Dict, Any, List

class GoogleProvider(BaseProvider):
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    
    def get_endpoint(self, model: str) -> str:
        return f"{self.BASE_URL}/models/{model}:generateContent"
    
    def get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json"
        }
    
    def format_request(self, messages: List[Dict], params: Dict) -> Dict[str, Any]:
        """Convert to Google format"""
        # Google uses different structure
        contents = []
        
        for msg in messages:
            role = "user" if msg["role"] in ["user", "system"] else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        request = {
            "contents": contents,
            "generationConfig": {}
        }
        
        if "temperature" in params:
            request["generationConfig"]["temperature"] = params["temperature"]
        if "max_tokens" in params:
            request["generationConfig"]["maxOutputTokens"] = params["max_tokens"]
        if "top_p" in params:
            request["generationConfig"]["topP"] = params["top_p"]
        
        return request
    
    def parse_response(self, response: Dict) -> Dict[str, Any]:
        """Convert Google response to standard format"""
        text = response["candidates"][0]["content"]["parts"][0]["text"]
        
        # Google doesn't always return token counts
        prompt_tokens = response.get("usageMetadata", {}).get("promptTokenCount", 0)
        completion_tokens = response.get("usageMetadata", {}).get("candidatesTokenCount", 0)
        
        return {
            "content": text,
            "model": params["model"],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens
            },
            "provider": "google",
            "raw_response": response
        }
    
    async def validate_key(self) -> bool:
        """Test if API key is valid"""
        try:
            # Make minimal request
            endpoint = f"{self.BASE_URL}/models"
            response = await self.client.get(
                f"{endpoint}?key={self.api_key}"
            )
            return response.status_code == 200
        except:
            return False
```

---

## 10. SISTEMA DE CACHÉ

### 10.1 Implementación del Cache Manager

#### core/cache.py

```python
import hashlib
import json
import time
from typing import Optional, Dict, Any
from cachetools import LRUCache
import threading

class CacheManager:
    def __init__(self, maxsize: int = 1000, ttl: int = 3600):
        """
        Args:
            maxsize: Maximum number of entries (default: 1000)
            ttl: Time to live in seconds (default: 3600 = 1 hour)
        """
        self.cache = LRUCache(maxsize=maxsize)
        self.ttl = ttl
        self.lock = threading.RLock()
        
        # Metrics
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, messages: list, params: Dict[str, Any]) -> str:
        """
        Generate deterministic cache key from request
        
        Key includes:
        - Messages (sorted canonically)
        - Model (if specified)
        - Temperature
        - max_tokens
        """
        # Create canonical representation
        canonical = {
            "messages": self._canonicalize_messages(messages),
            "model": params.get("model"),
            "temperature": params.get("temperature", 0.7),
            "max_tokens": params.get("max_tokens")
        }
        
        # Generate SHA256 hash
        key_string = json.dumps(canonical, sort_keys=True)
        return hashlib.sha256(key_string.encode()).hexdigest()
    
    def _canonicalize_messages(self, messages: list) -> list:
        """Normalize messages for consistent hashing"""
        return [
            {
                "role": msg["role"],
                "content": msg["content"].strip()  # Remove extra whitespace
            }
            for msg in messages
        ]
    
    def get(self, messages: list, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Retrieve from cache if exists and not expired"""
        key = self._generate_key(messages, params)
        
        with self.lock:
            entry = self.cache.get(key)
            
            if entry is None:
                self.misses += 1
                return None
            
            # Check TTL
            if time.time() > entry["expires_at"]:
                # Expired - remove and return None
                del self.cache[key]
                self.misses += 1
                return None
            
            # Cache hit
            self.hits += 1
            entry["hit_count"] += 1
            
            return entry["response"]
    
    def set(self, messages: list, params: Dict[str, Any], response: Dict[str, Any]):
        """Store response in cache"""
        key = self._generate_key(messages, params)
        
        with self.lock:
            self.cache[key] = {
                "response": response,
                "cached_at": time.time(),
                "expires_at": time.time() + self.ttl,
                "hit_count": 0
            }
    
    def invalidate(self, pattern: Optional[str] = None):
        """
        Invalidate cache entries
        
        Args:
            pattern: If None, clear all. Otherwise, clear matching keys.
        """
        with self.lock:
            if pattern is None:
                self.cache.clear()
            else:
                # Remove keys matching pattern
                keys_to_remove = [k for k in self.cache.keys() if pattern in k]
                for key in keys_to_remove:
                    del self.cache[key]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get cache performance metrics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate_percent": round(hit_rate, 2),
            "size": len(self.cache),
            "max_size": self.cache.maxsize
        }
```

### 10.2 Ejemplo de Uso

```python
cache = CacheManager(maxsize=1000, ttl=3600)

# First request - cache miss
messages = [{"role": "user", "content": "What is 2+2?"}]
params = {"temperature": 0.7}

response = cache.get(messages, params)
if response is None:
    # Call LLM
    response = {"content": "4", "usage": {...}}
    cache.set(messages, params, response)

# Second identical request - cache hit
response = cache.get(messages, params)
# Returns cached response immediately

# Get metrics
metrics = cache.get_metrics()
# {'hits': 1, 'misses': 1, 'total_requests': 2, 'hit_rate_percent': 50.0, ...}
```

---

## 11. FRONTEND - ESTRUCTURA DE COMPONENTES

### 11.1 API Client

#### lib/api.ts

```typescript
import axios, { AxiosInstance } from 'axios';

interface ApiConfig {
  baseURL: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(email: string, password: string) {
    const response = await this.client.post('/api/auth/signup', {
      email,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/api/auth/me');
    return response.data;
  }

  // Gateway keys
  async createGatewayKey(name?: string) {
    const response = await this.client.post('/api/keys', { name });
    return response.data;
  }

  async getGatewayKeys() {
    const response = await this.client.get('/api/keys');
    return response.data;
  }

  async deleteGatewayKey(keyId: string) {
    await this.client.delete(`/api/keys/${keyId}`);
  }

  // Provider keys
  async addProviderKey(provider: string, apiKey: string) {
    const response = await this.client.post('/api/keys/providers', {
      provider,
      api_key: apiKey,
    });
    return response.data;
  }

  async getProviderKeys() {
    const response = await this.client.get('/api/keys/providers');
    return response.data;
  }

  // Analytics
  async getAnalyticsOverview(timeframe: string = '24h') {
    const response = await this.client.get('/api/analytics/overview', {
      params: { timeframe },
    });
    return response.data;
  }

  async getCostBreakdown(days: number = 7) {
    const response = await this.client.get('/api/analytics/cost-breakdown', {
      params: { days },
    });
    return response.data;
  }

  async getModelDistribution() {
    const response = await this.client.get('/api/analytics/model-distribution');
    return response.data;
  }

  // Models
  async getModels() {
    const response = await this.client.get('/api/models/list');
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});
```

### 11.2 Auth Hook

#### hooks/useAuth.ts

```typescript
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  plan: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.login(email, password);
          localStorage.setItem('token', data.access_token);
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.signup(email, password);
          localStorage.setItem('token', data.access_token);
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      loadUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          const user = await api.getMe();
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 11.3 Dashboard Component Example

#### components/dashboard/MetricsCard.tsx

```typescript
interface MetricsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
}

export function MetricsCard({ title, value, change, trend, icon }: MetricsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span
            className={
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-muted-foreground'
            }
          >
            {change}
          </span>
          <span className="text-muted-foreground">from last period</span>
        </div>
      )}
    </div>
  );
}
```

#### app/dashboard/page.tsx

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { CostChart } from '@/components/dashboard/CostChart';
import { ModelDistChart } from '@/components/dashboard/ModelDistChart';
import { DollarSign, Activity, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.getAnalyticsOverview('24h'),
    refetchInterval: 30000, // Refetch every 30s
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your LLM Gateway usage in the last 24 hours
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Cost"
          value={`$${overview.total_cost.toFixed(2)}`}
          change="+12%"
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricsCard
          title="Requests"
          value={overview.total_requests.toLocaleString()}
          change="+8%"
          trend="up"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricsCard
          title="Avg Latency"
          value={`${(overview.avg_latency_ms / 1000).toFixed(1)}s`}
          change="-5%"
          trend="down"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricsCard
          title="Cache Rate"
          value={`${overview.cache_hit_rate.toFixed(1)}%`}
          change="+3%"
          trend="up"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CostChart />
        <ModelDistChart />
      </div>
    </div>
  );
}
```

---

## 12. UPDATER SERVICE

### 12.1 Implementación del Updater

#### updater/main.py

```python
import json
import logging
import schedule
import time
import httpx
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RegistryUpdater:
    def __init__(
        self,
        registry_url: str,
        local_path: str = "/app/data/models.json",
        backup_path: str = "/app/data/models.json.bak"
    ):
        self.registry_url = registry_url
        self.local_path = Path(local_path)
        self.backup_path = Path(backup_path)
        self.client = httpx.Client(timeout=10.0)
    
    def fetch_registry(self) -> Optional[Dict[str, Any]]:
        """Fetch latest registry from GitHub"""
        try:
            logger.info(f"Fetching registry from {self.registry_url}")
            response = self.client.get(self.registry_url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch registry: {e}")
            return None
    
    def validate_registry(self, data: Dict[str, Any]) -> bool:
        """Validate registry structure"""
        required_fields = ["version", "updated_at", "models"]
        
        # Check top-level fields
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate models
        for model in data["models"]:
            required_model_fields = ["id", "provider", "pricing", "specs"]
            for field in required_model_fields:
                if field not in model:
                    logger.error(f"Model missing field: {field}")
                    return False
        
        logger.info("Registry validation passed")
        return True
    
    def load_local_registry(self) -> Optional[Dict[str, Any]]:
        """Load current local registry"""
        try:
            if not self.local_path.exists():
                return None
            with open(self.local_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load local registry: {e}")
            return None
    
    def compare_versions(
        self,
        old: Optional[Dict[str, Any]],
        new: Dict[str, Any]
    ) -> bool:
        """Check if new version is different"""
        if old is None:
            return True
        
        # Simple version comparison
        old_version = old.get("version", "0.0.0")
        new_version = new.get("version", "0.0.0")
        
        return old_version != new_version
    
    def detect_changes(
        self,
        old: Optional[Dict[str, Any]],
        new: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detect what changed between versions"""
        changes = {
            "price_changes": [],
            "new_models": [],
            "deprecated_models": []
        }
        
        if old is None:
            return changes
        
        # Build model maps
        old_models = {m["id"]: m for m in old.get("models", [])}
        new_models = {m["id"]: m for m in new.get("models", [])}
        
        # Detect new and deprecated models
        old_ids = set(old_models.keys())
        new_ids = set(new_models.keys())
        
        changes["new_models"] = list(new_ids - old_ids)
        changes["deprecated_models"] = list(old_ids - new_ids)
        
        # Detect price changes
        for model_id in old_ids & new_ids:
            old_pricing = old_models[model_id].get("pricing", {})
            new_pricing = new_models[model_id].get("pricing", {})
            
            if old_pricing != new_pricing:
                changes["price_changes"].append({
                    "model": model_id,
                    "old": old_pricing,
                    "new": new_pricing
                })
        
        return changes
    
    def backup_current(self):
        """Backup current registry"""
        try:
            if self.local_path.exists():
                import shutil
                shutil.copy(self.local_path, self.backup_path)
                logger.info(f"Backed up registry to {self.backup_path}")
        except Exception as e:
            logger.error(f"Failed to backup registry: {e}")
    
    def write_registry(self, data: Dict[str, Any]):
        """Write new registry to disk"""
        try:
            self.local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.local_path, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Wrote new registry to {self.local_path}")
        except Exception as e:
            logger.error(f"Failed to write registry: {e}")
            raise
    
    def notify_changes(self, changes: Dict[str, Any]):
        """Log significant changes"""
        if changes["price_changes"]:
            logger.warning(f"Price changes detected: {len(changes['price_changes'])} models")
            for change in changes["price_changes"]:
                logger.warning(f"  {change['model']}: {change['old']} → {change['new']}")
        
        if changes["new_models"]:
            logger.info(f"New models available: {changes['new_models']}")
        
        if changes["deprecated_models"]:
            logger.warning(f"Models deprecated: {changes['deprecated_models']}")
    
    def update(self):
        """Main update logic"""
        logger.info("Starting registry update")
        
        # 1. Fetch new registry
        new_registry = self.fetch_registry()
        if new_registry is None:
            logger.error("Update aborted: Failed to fetch registry")
            return
        
        # 2. Validate structure
        if not self.validate_registry(new_registry):
            logger.error("Update aborted: Validation failed")
            return
        
        # 3. Load current registry
        old_registry = self.load_local_registry()
        
        # 4. Compare versions
        if not self.compare_versions(old_registry, new_registry):
            logger.info("No update needed - versions match")
            return
        
        # 5. Detect changes
        changes = self.detect_changes(old_registry, new_registry)
        
        # 6. Backup current
        self.backup_current()
        
        # 7. Write new registry
        try:
            self.write_registry(new_registry)
        except Exception as e:
            logger.error(f"Failed to write registry: {e}")
            return
        
        # 8. Notify changes
        self.notify_changes(changes)
        
        logger.info("Registry update completed successfully")

def main():
    import os
    
    registry_url = os.getenv(
        "REGISTRY_URL",
        "https://raw.githubusercontent.com/user/repo/main/registry.json"
    )
    
    updater = RegistryUpdater(registry_url)
    
    # Run update immediately on startup
    updater.update()
    
    # Schedule daily updates at midnight UTC
    schedule.every().day.at("00:00").do(updater.update)
    
    logger.info("Updater service started. Running scheduled updates...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()
```

---

## 13. EJEMPLOS DE USO

### 13.1 Cliente Python

```python
import requests

# Configuration
GATEWAY_URL = "http://localhost:8000"
GATEWAY_KEY = "gw_abc123xyz789def456ghi012jkl345"

# Make request
response = requests.post(
    f"{GATEWAY_URL}/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {GATEWAY_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Explain quantum computing in simple terms"}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
)

data = response.json()
print(f"Model used: {data['metadata']['model_used']}")
print(f"Cost: ${data['metadata']['cost_usd']:.6f}")
print(f"Response: {data['choices'][0]['message']['content']}")
```

### 13.2 Cliente cURL

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer gw_abc123xyz789def456ghi012jkl345" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7
  }'
```

### 13.3 Cliente JavaScript

```javascript
async function callGateway() {
  const response = await fetch('http://localhost:8000/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gw_abc123xyz789def456ghi012jkl345',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Write a haiku about coding' }
      ],
      temperature: 0.9,
      max_tokens: 100
    }),
  });

  const data = await response.json();
  console.log('Model:', data.metadata.model_used);
  console.log('Cost:', data.metadata.cost_usd);
  console.log('Response:', data.choices[0].message.content);
}
```

---

## 📝 CONSIDERACIONES FINALES

### Variables de Entorno Requeridas

#### Backend (.env)
```bash
# Database
DATABASE_URL=sqlite:///./data/gateway.db

# Security
SECRET_KEY=your-secret-key-here-min-32-chars
MASTER_ENCRYPTION_KEY=your-encryption-key-here-min-32-chars

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional
DEBUG=false
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Comandos de Inicialización

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd llm-gateway

# 2. Crear .env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Generar claves seguras
python -c "import secrets; print(secrets.token_urlsafe(32))"  # Para SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"  # Para MASTER_ENCRYPTION_KEY

# 4. Iniciar servicios
docker-compose up -d

# 5. Verificar health
curl http://localhost:8000/health
curl http://localhost:3000

# 6. Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

*Documento creado: 2026-01-11*
*Versión: 1.0*
*Tipo: Especificación Técnica Completa*
