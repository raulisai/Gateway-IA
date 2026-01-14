---
title: Arquitectura Backend
type: architecture
layer: backend
created: '2026-01-11'
tags:
  - arquitectura
  - backend
  - fastapi
  - python
---
# 🔧 Arquitectura Backend - FastAPI

> El backend es el corazón del sistema, responsable del procesamiento inteligente de requests, enrutamiento optimizado y gestión de proveedores LLM.

## Visión General del Backend

```mermaid
graph TB
    subgraph "API Layer"
        direction LR
        REST[REST Endpoints]
        WS[WebSocket<br/>Streaming]
    end
    
    subgraph "Middleware Layer"
        CORS[CORS]
        Auth[JWT Auth]
        Rate[Rate Limiter]
        Log[Logger]
        Metrics[Metrics]
    end
    
    subgraph "Service Layer"
        AuthSvc[Auth Service]
        ClassSvc[Classifier Service]
        RouteSvc[Routing Service]
        CacheSvc[Cache Service]
        ProvSvc[Provider Service]
        AnalyticsSvc[Analytics Service]
        RegScraper[Registry Scraper<br/>Actualización de Modelos]
    end
    
    subgraph "Data Layer"
        Repo[Repositories]
        ORM[SQLAlchemy ORM]
        FileIO[File I/O]
    end
    
    subgraph "Infrastructure"
        DB[(SQLite)]
        Registry[models.json]
        Vault[Key Vault]
    end
    
    REST & WS --> CORS --> Auth --> Rate --> Log --> Metrics
    Metrics --> AuthSvc & ClassSvc & RouteSvc & CacheSvc & ProvSvc & AnalyticsSvc & RegScraper
    
    AuthSvc & AnalyticsSvc --> Repo
    ClassSvc --> RouteSvc
    RouteSvc --> CacheSvc --> ProvSvc
    RouteSvc --> FileIO
    RegScraper --> FileIO
    ProvSvc --> Vault
    
    Repo --> ORM --> DB
    FileIO --> Registry
    Vault --> DB
    
    style REST fill:#009688
    style ClassSvc fill:#9b59b6
    style RouteSvc fill:#e74c3c
    style CacheSvc fill:#f39c12
```

## Estructura de Directorios

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point FastAPI
│   ├── config.py               # Configuración y settings
│   │
│   ├── api/                    # Capa de API
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencias compartidas
│   │   ├── middleware/         # Middlewares
│   │   │   ├── auth.py
│   │   │   ├── rate_limit.py
│   │   │   └── logging.py
│   │   └── routes/             # Endpoints
│   │       ├── auth.py         # /api/auth/*
│   │       ├── keys.py         # /api/keys/*
│   │       ├── analytics.py    # /api/analytics/*
│   │       ├── models.py       # /api/models/*
│   │       ├── admin.py        # /api/admin/* (update registry)
│   │       └── gateway.py      # /v1/chat/*
│   │
│   ├── core/                   # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── classifier/         # Clasificación de requests
│   │   │   ├── base.py
│   │   │   ├── rules.py
│   │   │   └── ml.py
│   │   ├── router/             # Selección de modelos
│   │   │   ├── engine.py
│   │   │   ├── strategies.py
│   │   │   └── scorer.py
│   │   ├── cache/              # Sistema de caché
│   │   │   ├── manager.py
│   │   │   └── semantic.py
│   │   └── providers/          # Adaptadores de proveedores
│   │       ├── base.py
│   │       ├── openai.py
│   │       ├── anthropic.py
│   │       └── google.py
│   │
│   ├── models/                 # Modelos de datos
│   │   ├── __init__.py
│   │   ├── database.py         # Modelos SQLAlchemy
│   │   └── schemas.py          # Pydantic schemas
│   │
│   ├── services/               # Servicios de aplicación
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── key_service.py
│   │   ├── analytics_service.py
│   │   ├── model_registry.py
│   │   └── registry_scraper.py  # Scraping de precios y modelos
│   │
│   └── utils/                  # Utilidades
│       ├── __init__.py
│       ├── crypto.py           # Encriptación
│       ├── tokens.py           # Conteo de tokens
│       └── cost.py             # Cálculo de costos
│
├── tests/                      # Tests
├── alembic/                    # Migraciones DB
├── requirements.txt
└── Dockerfile
```

## Componentes Principales

### 1. Request Pipeline

```mermaid
graph LR
    subgraph "Entrada"
        REQ[HTTP Request]
    end
    
    subgraph "Pipeline de Procesamiento"
        M1[1. CORS]
        M2[2. Rate Limit]
        M3[3. Auth]
        M4[4. Validate]
        M5[5. Cache Check]
        M6[6. Classify]
        M7[7. Route]
        M8[8. Execute]
        M9[9. Log]
    end
    
    subgraph "Salida"
        RES[HTTP Response]
    end
    
    REQ --> M1 --> M2 --> M3 --> M4 --> M5
    M5 -->|Hit| M9
    M5 -->|Miss| M6 --> M7 --> M8 --> M9
    M9 --> RES
```

### 2. Sistema de Clasificación

```mermaid
graph TB
    subgraph "Entrada"
        Input[Request Body]
    end
    
    subgraph "Feature Extraction"
        FE1[Token Count]
        FE2[Message Length]
        FE3[Conversation Depth]
        FE4[Keyword Analysis]
        FE5[Code Detection]
    end
    
    subgraph "Clasificación"
        Rules[Rule-Based<br/>Classifier]
        ML[ML Classifier<br/>Future]
    end
    
    subgraph "Salida"
        Simple[SIMPLE<br/>Tareas básicas]
        Moderate[MODERATE<br/>Conversaciones]
        Complex[COMPLEX<br/>Análisis profundo]
        Expert[EXPERT<br/>Tareas críticas]
    end
    
    Input --> FE1 & FE2 & FE3 & FE4 & FE5
    FE1 & FE2 & FE3 & FE4 & FE5 --> Rules
    Rules --> ML
    ML --> Simple & Moderate & Complex & Expert
    
    style Rules fill:#9b59b6
    style ML fill:#3498db,stroke-dasharray: 5 5
```

### 3. Motor de Enrutamiento

```mermaid
graph TB
    subgraph "Entrada"
        Complexity[Nivel de<br/>Complejidad]
        Config[User<br/>Preferences]
    end
    
    subgraph "Filtrado"
        F1[Filter by<br/>Context Window]
        F2[Filter by<br/>Provider Health]
        F3[Filter by<br/>Rate Limits]
        F4[Filter by<br/>User Keys]
    end
    
    subgraph "Scoring"
        S1[Cost Score<br/>40%]
        S2[Quality Score<br/>35%]
        S3[Speed Score<br/>25%]
        Total[Weighted<br/>Total]
    end
    
    subgraph "Selección"
        Best[Best Model]
        Fallbacks[Fallback<br/>Models]
    end
    
    Complexity --> F1
    Config --> F1
    F1 --> F2 --> F3 --> F4
    F4 --> S1 & S2 & S3
    S1 & S2 & S3 --> Total
    Total --> Best & Fallbacks
    
    style Total fill:#e74c3c
```

## Flujo de Datos Detallado

### Request de Chat Completion

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant GW as Gateway Route
    participant AU as Auth Middleware
    participant CA as Cache Manager
    participant CL as Classifier
    participant RT as Router Engine
    participant RG as Model Registry
    participant PM as Provider Manager
    participant KV as Key Vault
    participant PR as Provider API
    participant TR as Usage Tracker
    participant DB as Database
    
    C->>GW: POST /v1/chat/completions
    Note over GW: Headers: Authorization: Bearer gw_xxx
    
    GW->>AU: Validate token
    AU->>DB: Query gateway_keys
    DB-->>AU: Key data
    AU-->>GW: User context
    
    GW->>CA: get_cached(hash(messages))
    alt Cache Hit
        CA-->>GW: Cached response
        GW->>TR: log(cache_hit=true)
        GW-->>C: Response
    else Cache Miss
        CA-->>GW: None
        
        GW->>CL: classify(messages)
        Note over CL: Extract features:<br/>tokens, depth, keywords
        CL-->>GW: complexity="moderate"
        
        GW->>RT: select_model(complexity, user_config)
        RT->>RG: get_available_models()
        RG-->>RT: [gpt-4o-mini, claude-haiku, ...]
        RT->>RT: filter & score models
        RT-->>GW: {model: "gpt-4o-mini", fallbacks: [...]}
        
        GW->>PM: execute(request, model)
        PM->>KV: get_key(user_id, "openai")
        KV->>DB: Fetch encrypted key
        DB-->>KV: encrypted_key
        KV-->>PM: decrypted_key
        
        PM->>PR: POST /chat/completions
        PR-->>PM: LLM Response
        
        PM-->>GW: Unified response
        
        par Store & Log
            GW->>CA: set(hash, response, ttl=3600)
            GW->>TR: log(tokens, cost, latency)
            TR->>DB: INSERT request_log
        end
        
        GW-->>C: Response
    end
```

## Configuración y Settings

```python
# config.py (representación conceptual)
class Settings:
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/gateway.db"
    
    # Security
    SECRET_KEY: str  # Para JWT
    ENCRYPTION_KEY: str  # Para API keys
    JWT_EXPIRATION: int = 86400  # 24 hours
    
    # Cache
    CACHE_MAX_SIZE: int = 1000
    CACHE_TTL: int = 3600
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Providers
    PROVIDERS_CONFIG: dict = {
        "openai": {"base_url": "https://api.openai.com/v1"},
        "anthropic": {"base_url": "https://api.anthropic.com"},
        "google": {"base_url": "https://generativelanguage.googleapis.com"}
    }
```

## Manejo de Errores

```mermaid
graph TB
    Error[Error Ocurre] --> Type{Tipo de<br/>Error}
    
    Type -->|Auth| E401[401 Unauthorized]
    Type -->|Validation| E400[400 Bad Request]
    Type -->|Rate Limit| E429[429 Too Many Requests]
    Type -->|Provider| ProviderError
    Type -->|Internal| E500[500 Internal Error]
    
    ProviderError --> Retry{Retries<br/>disponibles?}
    Retry -->|Sí| RetryLogic[Exponential Backoff]
    RetryLogic --> Execute[Reintentar]
    Execute --> Success{Éxito?}
    Success -->|Sí| Return[Return Response]
    Success -->|No| Retry
    
    Retry -->|No| Fallback{Fallback<br/>disponible?}
    Fallback -->|Sí| TryFallback[Usar modelo alternativo]
    TryFallback --> Execute
    Fallback -->|No| E503[503 Service Unavailable]
    
    style E401 fill:#e74c3c
    style E400 fill:#f39c12
    style E429 fill:#9b59b6
    style E503 fill:#c0392b
```

## Dependencias Principales

```mermaid
graph LR
    subgraph "Web Framework"
        FastAPI[FastAPI]
        Uvicorn[Uvicorn]
    end
    
    subgraph "Data"
        SQLAlchemy[SQLAlchemy]
        Pydantic[Pydantic]
    end
    
    subgraph "HTTP"
        HTTPX[HTTPX]
        Requests[Requests]
    end
    
    subgraph "Security"
        PyJWT[PyJWT]
        Cryptography[Cryptography]
        Passlib[Passlib]
    end
    
    subgraph "Utils"
        Tiktoken[Tiktoken]
        Python_dotenv[python-dotenv]
    end
    
    FastAPI --> Pydantic
    FastAPI --> Uvicorn
    FastAPI --> SQLAlchemy
    FastAPI --> PyJWT
    FastAPI --> HTTPX
```

## Documentos Relacionados

- [[../backend/api-routes|Definición de Rutas API]]
- [[../backend/services/classifier|Servicio de Clasificación]]
- [[../backend/services/router|Motor de Enrutamiento]]
- [[../backend/security|Seguridad]]
- [[../backend/database|Base de Datos]]

---

*Ver también: [[overview|Arquitectura General]] | [[frontend-architecture|Arquitectura Frontend]]*
