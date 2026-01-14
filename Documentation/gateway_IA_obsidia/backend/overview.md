---
title: Backend Overview
type: documentation
layer: backend
created: '2026-01-11'
tags:
  - backend
  - fastapi
  - overview
---
# 🔙 Backend Overview

> FastAPI backend que proporciona enrutamiento inteligente, gestión de claves y analytics para el LLM Gateway.

## Resumen Ejecutivo

El backend es responsable de:

```mermaid
mindmap
  root((Backend<br/>FastAPI))
    Gateway API
      Request Reception
      Classification
      Routing
      Execution
    Management API
      Authentication
      Key Management
      Analytics
    Core Services
      Classifier
      Router
      Cache
      Providers
    Data Layer
      SQLite
      Model Registry
      Key Vault
```

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | FastAPI | 0.109+ |
| Runtime | Python | 3.11+ |
| ORM | SQLAlchemy | 2.0+ |
| Validation | Pydantic | 2.0+ |
| HTTP Client | HTTPX | 0.27+ |
| Security | PyJWT, Cryptography | Latest |
| Testing | Pytest, HTTPX | Latest |

## Endpoints Principales

```mermaid
graph LR
    subgraph "Auth API"
        A1[POST /api/auth/signup]
        A2[POST /api/auth/login]
        A3[POST /api/auth/logout]
        A4[GET /api/auth/me]
    end
    
    subgraph "Keys API"
        K1[GET /api/keys/gateway]
        K2[POST /api/keys/gateway]
        K3[DELETE /api/keys/gateway/:id]
        K4[GET /api/keys/providers]
        K5[POST /api/keys/providers]
    end
    
    subgraph "Analytics API"
        AN1[GET /api/analytics/overview]
        AN2[GET /api/analytics/cost-breakdown]
        AN3[GET /api/analytics/model-distribution]
        AN4[GET /api/analytics/requests]
    end
    
    subgraph "Gateway API"
        G1[POST /v1/chat/completions]
        G2[GET /v1/models]
    end
    
    style G1 fill:#e74c3c
    style G2 fill:#e74c3c
```

## Flujo de Request Principal

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as /v1/chat/completions
    participant Auth
    participant Cache
    participant Classifier
    participant Router
    participant Provider
    participant DB
    
    Client->>Gateway: POST request
    Gateway->>Auth: Validate API key
    Auth->>DB: Check gateway_keys
    DB-->>Auth: Valid
    
    Gateway->>Cache: Check cache
    Cache-->>Gateway: Miss
    
    Gateway->>Classifier: Classify complexity
    Classifier-->>Gateway: "moderate"
    
    Gateway->>Router: Select model
    Router-->>Gateway: "gpt-4o-mini"
    
    Gateway->>Provider: Execute request
    Provider-->>Gateway: Response
    
    Gateway->>Cache: Store response
    Gateway->>DB: Log usage
    
    Gateway-->>Client: Response
```

## Servicios Core

### 1. Request Classifier
Analiza la complejidad del request para determinar el modelo óptimo.

```mermaid
graph TB
    Input[Request] --> FE[Feature Extraction]
    
    FE --> F1[Token Count]
    FE --> F2[Message Depth]
    FE --> F3[System Prompt Length]
    FE --> F4[Code Detection]
    FE --> F5[Keyword Analysis]
    
    F1 & F2 & F3 & F4 & F5 --> Rules[Rule Engine]
    Rules --> Output{Complexity}
    
    Output --> Simple[SIMPLE]
    Output --> Moderate[MODERATE]
    Output --> Complex[COMPLEX]
    Output --> Expert[EXPERT]
```

### 2. Routing Engine
Selecciona el modelo óptimo basado en múltiples factores.

```mermaid
graph TB
    Complexity[Complexity Level] --> Filter[Model Filter]
    UserConfig[User Preferences] --> Filter
    
    Filter --> Score[Scoring Engine]
    
    Score --> Cost[Cost Score<br/>40%]
    Score --> Quality[Quality Score<br/>35%]
    Score --> Speed[Speed Score<br/>25%]
    
    Cost & Quality & Speed --> Best[Best Model]
    Best --> Fallbacks[Fallback List]
```

### 3. Cache Manager
LRU cache con soporte para caché semántico.

```mermaid
graph LR
    Request --> Hash[Generate Hash]
    Hash --> Lookup[Cache Lookup]
    
    Lookup -->|Hit| Return[Return Cached]
    Lookup -->|Miss| Process[Process Request]
    
    Process --> Store[Store in Cache]
    Store --> Return
```

### 4. Provider Manager
Adaptadores unificados para múltiples proveedores LLM.

```mermaid
classDiagram
    class ProviderBase {
        <<abstract>>
        +name: str
        +base_url: str
        +chat_completions(request)
        +list_models()
    }
    
    class OpenAIProvider {
        +chat_completions(request)
        +list_models()
    }
    
    class AnthropicProvider {
        +chat_completions(request)
        +convert_format()
    }
    
    class GoogleProvider {
        +chat_completions(request)
        +convert_format()
    }
    
    ProviderBase <|-- OpenAIProvider
    ProviderBase <|-- AnthropicProvider
    ProviderBase <|-- GoogleProvider
```

## Configuración

```python
# Ejemplo de configuración
class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/gateway.db"
    
    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    
    # Cache
    CACHE_MAX_SIZE: int = 1000
    CACHE_TTL: int = 3600
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW: int = 60
    
    class Config:
        env_file = ".env"
```

## Manejo de Errores

```mermaid
graph TB
    Error[Error] --> Type{Tipo}
    
    Type -->|Validation| E400[400 Bad Request]
    Type -->|Auth| E401[401 Unauthorized]
    Type -->|Permission| E403[403 Forbidden]
    Type -->|Not Found| E404[404 Not Found]
    Type -->|Rate Limit| E429[429 Too Many Requests]
    Type -->|Provider| ProviderError
    Type -->|Internal| E500[500 Internal Error]
    
    ProviderError --> Retry{Retry?}
    Retry -->|Yes| RetryLogic[Exponential Backoff]
    Retry -->|No| Fallback{Fallback?}
    Fallback -->|Yes| TryFallback[Use Fallback Model]
    Fallback -->|No| E503[503 Service Unavailable]
```

## Métricas Expuestas

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `gateway_requests_total` | Counter | Total de requests |
| `gateway_latency_seconds` | Histogram | Latencia de requests |
| `gateway_cost_usd_total` | Counter | Costo total acumulado |
| `gateway_cache_hits_total` | Counter | Cache hits |
| `gateway_cache_misses_total` | Counter | Cache misses |
| `gateway_provider_errors_total` | Counter | Errores por provider |

## Documentos Relacionados

- [[api-routes|Definición de Rutas API]]
- [[services/classifier|Clasificador de Requests]]
- [[services/router|Motor de Enrutamiento]]
- [[services/cache|Sistema de Cache]]
- [[services/providers|Adaptadores de Proveedores]]
- [[security|Seguridad]]
- [[database|Base de Datos]]

---

*Ver también: [[../arquitectura/backend-architecture|Arquitectura Backend]]*
