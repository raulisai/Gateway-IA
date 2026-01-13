# 🔙 LLM Gateway - Resumen Detallado del Backend

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Servicios Core](#servicios-core)
6. [API Endpoints](#api-endpoints)
7. [Seguridad](#seguridad)
8. [Flujo Principal de Requests](#flujo-principal)

---

## 1. Arquitectura General

### Componentes Principales
```
Backend FastAPI
├── API Gateway (/v1/chat/completions) - Endpoint principal
├── Management API (/api/*) - Auth, Keys, Analytics
├── Core Services
│   ├── Request Classifier - Analiza complejidad
│   ├── Routing Engine - Selecciona modelo óptimo
│   ├── Cache Manager - Cache LRU en memoria
│   └── Provider Manager - Adaptadores para OpenAI/Anthropic/Google
└── Data Layer
    ├── SQLite Database
    ├── Model Registry (JSON)
    └── Key Vault (Encrypted)
```

### Responsabilidades
1. **Recibir requests** del cliente con gateway key
2. **Clasificar complejidad** del prompt (simple/moderate/complex/expert)
3. **Enrutar** al mejor modelo según costo/calidad/velocidad
4. **Ejecutar** llamada al proveedor LLM seleccionado
5. **Cachear** respuestas para requests idénticos
6. **Loguear** uso, costos y métricas
7. **Proveer analytics** al dashboard

---

## 2. Stack Tecnológico

### Versiones Exactas
| Componente | Versión |
|------------|---------|
| Python | 3.11.8 |
| FastAPI | 0.109.0 |
| Uvicorn | 0.27.0 |
| SQLAlchemy | 2.0.25 |
| Pydantic | 2.5.3 |
| HTTPX | 0.26.0 |
| PyJWT | 2.8.0 |
| Cryptography | 42.0.0 |
| Bcrypt | 4.1.2 |
| Tiktoken | 0.5.2 |
| CacheTool | 5.3.2 |

### Librerías Adicionales
- `python-dotenv` - Variables de entorno
- `python-multipart` - Upload de archivos
- `tenacity` - Retry logic
- `APScheduler` - Tareas programadas

---

## 3. Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Inicialización FastAPI
│   ├── config.py                  # Settings (env vars)
│   ├── database.py                # SQLAlchemy setup
│   │
│   ├── models/                    # SQLAlchemy ORM models
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
│   │   ├── deps.py                # Dependencies (auth, db)
│   │   ├── auth.py                # /api/auth/*
│   │   ├── keys.py                # /api/keys/*
│   │   ├── analytics.py           # /api/analytics/*
│   │   ├── models.py              # /api/models/*
│   │   └── gateway.py             # /v1/chat/completions
│   │
│   ├── core/                      # Business logic
│   │   ├── __init__.py
│   │   ├── security.py            # JWT, encryption, hashing
│   │   ├── classifier.py          # Request complexity classifier
│   │   ├── router.py              # Model selection engine
│   │   ├── cache.py               # LRU cache manager
│   │   ├── tracker.py             # Usage/cost tracking
│   │   ├── registry.py            # Model registry loader
│   │   └── providers/
│   │       ├── __init__.py
│   │       ├── base.py            # BaseProvider (abstract)
│   │       ├── openai.py          # OpenAI adapter
│   │       ├── anthropic.py       # Anthropic adapter
│   │       └── google.py          # Google adapter
│   │
│   └── utils/
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
├── .env.example
└── README.md
```

---

## 4. Base de Datos

### Schema SQLite

#### Tabla: users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,              -- UUID
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,      -- bcrypt hash
    plan TEXT DEFAULT 'free',         -- 'free' | 'pro' | 'enterprise'
    created_at TEXT NOT NULL,         -- ISO 8601
    updated_at TEXT,
    is_active INTEGER DEFAULT 1       -- Boolean
);
CREATE INDEX idx_users_email ON users(email);
```

#### Tabla: gateway_keys
```sql
CREATE TABLE gateway_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,           -- SHA-256 del key
    prefix TEXT NOT NULL,             -- 'gw_abc123' (primeros 10 chars)
    name TEXT,
    is_active INTEGER DEFAULT 1,
    rate_limit INTEGER DEFAULT 100,   -- Requests/min
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_gateway_keys_hash ON gateway_keys(key_hash);
CREATE INDEX idx_gateway_keys_user ON gateway_keys(user_id);
```

#### Tabla: provider_keys
```sql
CREATE TABLE provider_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,           -- 'openai' | 'anthropic' | 'google'
    encrypted_key TEXT NOT NULL,      -- Fernet encrypted
    is_active INTEGER DEFAULT 1,
    last_verified_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_provider_keys_user_provider ON provider_keys(user_id, provider);
```

#### Tabla: request_logs
```sql
CREATE TABLE request_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    gateway_key_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    complexity TEXT NOT NULL,         -- 'simple' | 'moderate' | 'complex' | 'expert'
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    latency_ms INTEGER NOT NULL,
    cache_hit INTEGER DEFAULT 0,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (gateway_key_id) REFERENCES gateway_keys(id)
);
CREATE INDEX idx_logs_user_created ON request_logs(user_id, created_at);
CREATE INDEX idx_logs_model ON request_logs(model);
```

---

## 5. Servicios Core

### 5.1 Request Classifier

**Función**: Analizar complejidad del request para determinar modelo óptimo.

**Input**:
```python
{
    "messages": [
        {"role": "user", "content": "..."}
    ],
    "parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
    }
}
```

**Output**:
```python
{
    "complexity": "moderate",  # simple | moderate | complex | expert
    "estimated_tokens": 1500,
    "features": ["code", "analysis"]
}
```

**Lógica de Clasificación**:
1. **Token Count (60% peso)**:
   - Simple: 0-500 tokens
   - Moderate: 501-2000 tokens
   - Complex: 2001-8000 tokens
   - Expert: 8000+ tokens

2. **Complejidad Léxica (20% peso)**:
   - Detectar código (```backticks```)
   - Keywords técnicos (función, clase, algoritmo)
   - Análisis de profundidad

3. **Tipo de Tarea (20% peso)**:
   - QA simple vs análisis profundo
   - Generación creativa vs razonamiento
   - Coding tasks

**Implementación**:
```python
class RequestClassifier:
    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")
    
    def classify(self, messages, params):
        tokens = self.count_tokens(messages)
        features = self.extract_features(messages)
        score = self.calculate_score(tokens, features)
        complexity = self.map_complexity(score)
        return {
            "complexity": complexity,
            "estimated_tokens": tokens,
            "features": features
        }
```

---

### 5.2 Routing Engine

**Función**: Seleccionar el mejor modelo basándose en múltiples factores.

**Input**:
```python
{
    "complexity": "moderate",
    "estimated_tokens": 1500,
    "user_providers": ["openai", "anthropic"],
    "provider_health": {"openai": 1.0, "anthropic": 0.95}
}
```

**Output**:
```python
{
    "model_id": "gpt-4o-mini",
    "provider": "openai",
    "fallbacks": ["claude-3-haiku", "gemini-flash"]
}
```

**Pipeline de Decisión**:

1. **Filtrar modelos disponibles**:
   - Verificar que usuario tenga API key del provider
   - Verificar context window suficiente
   - Verificar health status del provider (>50%)

2. **Scoring de modelos**:
   ```python
   score = (quality_multiplier / cost_per_1m_tokens) + speed_bonus
   
   quality_multiplier = {
       "simple": 1.0,
       "moderate": 1.5,
       "complex": 2.0,
       "expert": 3.0
   }
   
   speed_bonus = {
       latency < 2s: +10,
       latency < 5s: +5,
       else: 0
   }
   ```

3. **Selección**:
   - Ordenar por score descendente
   - Retornar top 1 como seleccionado
   - Guardar top 3 como fallbacks

**Implementación**:
```python
class RoutingEngine:
    def __init__(self, registry):
        self.registry = registry
        self.quality_multipliers = {
            "simple": 1.0,
            "moderate": 1.5,
            "complex": 2.0,
            "expert": 3.0
        }
    
    def select_model(self, complexity, estimated_tokens, 
                     user_providers, provider_health):
        # 1. Filter available models
        models = self.filter_models(
            user_providers, 
            estimated_tokens, 
            provider_health
        )
        
        # 2. Score models
        scored = self.score_models(models, complexity)
        
        # 3. Select best
        return {
            "model_id": scored[0].model_id,
            "provider": scored[0].provider,
            "fallbacks": [m.model_id for m in scored[1:4]]
        }
```

---

### 5.3 Cache Manager

**Función**: Cache LRU en memoria para requests idénticos.

**Características**:
- LRU (Least Recently Used) eviction
- TTL (Time To Live) de 1 hora
- Max 1000 entries
- Thread-safe

**Cache Key Generation**:
```python
cache_key = sha256(
    json.dumps({
        "messages": canonicalize(messages),
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens
    }, sort_keys=True)
)
```

**Estructura**:
```python
{
    "hash123": {
        "response": {...},
        "timestamp": 1704067200,
        "ttl": 3600,
        "hit_count": 5
    }
}
```

**Implementación**:
```python
from cachetools import LRUCache

class CacheManager:
    def __init__(self, maxsize=1000, ttl=3600):
        self.cache = LRUCache(maxsize=maxsize)
        self.ttl = ttl
        self.hits = 0
        self.misses = 0
    
    def get(self, messages, params):
        key = self._generate_key(messages, params)
        entry = self.cache.get(key)
        
        if entry and not self._is_expired(entry):
            self.hits += 1
            return entry["response"]
        
        self.misses += 1
        return None
    
    def set(self, messages, params, response):
        key = self._generate_key(messages, params)
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "ttl": self.ttl
        }
```

---

### 5.4 Provider Manager

**Función**: Adaptadores unificados para diferentes proveedores LLM.

**Patrón**: Adapter Pattern con clase base abstracta.

#### BaseProvider (abstracto)
```python
class BaseProvider(ABC):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)
    
    @abstractmethod
    def format_request(self, messages, params):
        """Convertir a formato del provider"""
        pass
    
    @abstractmethod
    def parse_response(self, response):
        """Convertir al formato estándar"""
        pass
    
    @abstractmethod
    async def call(self, model, messages, params):
        """Hacer llamada al provider"""
        pass
```

#### OpenAI Provider
```python
class OpenAIProvider(BaseProvider):
    BASE_URL = "https://api.openai.com/v1"
    
    def format_request(self, messages, params):
        return {
            "model": params["model"],
            "messages": messages,
            "temperature": params.get("temperature", 0.7),
            "max_tokens": params.get("max_tokens")
        }
    
    def parse_response(self, response):
        return {
            "content": response["choices"][0]["message"]["content"],
            "usage": response["usage"],
            "model": response["model"],
            "provider": "openai"
        }
    
    async def call(self, model, messages, params):
        url = f"{self.BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = self.format_request(messages, params)
        
        response = await self.client.post(url, headers=headers, json=body)
        return self.parse_response(response.json())
```

#### Anthropic Provider
```python
class AnthropicProvider(BaseProvider):
    BASE_URL = "https://api.anthropic.com/v1"
    
    def format_request(self, messages, params):
        # Anthropic requiere system message separado
        system = None
        anthropic_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                anthropic_messages.append(msg)
        
        request = {
            "model": params["model"],
            "messages": anthropic_messages,
            "max_tokens": params.get("max_tokens", 1024)
        }
        
        if system:
            request["system"] = system
        
        return request
    
    def parse_response(self, response):
        return {
            "content": response["content"][0]["text"],
            "usage": {
                "prompt_tokens": response["usage"]["input_tokens"],
                "completion_tokens": response["usage"]["output_tokens"],
                "total_tokens": response["usage"]["input_tokens"] + 
                               response["usage"]["output_tokens"]
            },
            "model": response["model"],
            "provider": "anthropic"
        }
```

---

## 6. API Endpoints

### 6.1 Authentication API

#### POST /api/auth/signup
```python
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123"
}

Response 201:
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "plan": "free",
        "created_at": "2026-01-11T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login
```python
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123"
}

Response 200:
{
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /api/auth/me
```python
Headers:
    Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "email": "user@example.com",
    "plan": "free",
    "created_at": "2026-01-11T10:30:00Z"
}
```

---

### 6.2 Gateway Keys API

#### POST /api/keys/gateway
```python
Headers:
    Authorization: Bearer <token>

Request:
{
    "name": "Production Key"
}

Response 201:
{
    "id": "uuid",
    "key": "gw_abc123xyz789...",  # Solo se muestra UNA VEZ
    "prefix": "gw_abc123",
    "name": "Production Key",
    "created_at": "2026-01-11T10:30:00Z"
}
```

#### GET /api/keys/gateway
```python
Response 200:
{
    "keys": [
        {
            "id": "uuid",
            "prefix": "gw_abc123",
            "name": "Production Key",
            "created_at": "2026-01-11T10:30:00Z",
            "last_used_at": "2026-01-11T15:45:00Z",
            "is_active": true
        }
    ]
}
```

---

### 6.3 Provider Keys API

#### POST /api/keys/providers
```python
Request:
{
    "provider": "openai",
    "api_key": "sk-proj-abc123..."
}

Response 201:
{
    "provider": "openai",
    "is_active": true,
    "last_verified_at": "2026-01-11T10:30:00Z"
}
```

**Proceso**:
1. Validar formato del API key
2. Testear key con provider (llamada de prueba)
3. Si válida, encriptar con Fernet
4. Guardar en DB
5. Retornar éxito

---

### 6.4 Analytics API

#### GET /api/analytics/overview?timeframe=24h
```python
Response 200:
{
    "total_requests": 1523,
    "total_cost": 4.52,
    "avg_latency_ms": 2100,
    "cache_hit_rate": 23.5,
    "period": "24h"
}
```

#### GET /api/analytics/cost-breakdown?days=7
```python
Response 200:
{
    "data": [
        {"date": "2026-01-05", "cost": 0.85, "requests": 320},
        {"date": "2026-01-06", "cost": 1.20, "requests": 450},
        ...
    ]
}
```

#### GET /api/analytics/model-distribution
```python
Response 200:
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
        }
    ]
}
```

---

### 6.5 Gateway API (Principal)

#### POST /v1/chat/completions
**Endpoint principal del gateway - Compatible con formato OpenAI**

```python
Headers:
    Authorization: Bearer gw_abc123xyz789...
    Content-Type: application/json

Request:
{
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "model": "gpt-4o-mini",  # Opcional - override auto-routing
    "temperature": 0.7,
    "max_tokens": 150
}

Response 200:
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
                "content": "The capital of France is Paris..."
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

---

## 7. Seguridad

### 7.1 Encriptación de API Keys

**Problema**: Almacenar API keys de terceros (OpenAI, Anthropic) de forma segura.

**Solución**: Fernet (AES-256) encryption.

#### Variables de Entorno
```bash
MASTER_ENCRYPTION_KEY=your-32-char-secret-key-here
SECRET_KEY=your-jwt-secret-key-here
```

#### Proceso de Encriptación
```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class KeyVault:
    def __init__(self, master_password: str):
        # Derivar key desde master password
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'llm-gateway-salt',  # Debe ser único
            iterations=100000
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(master_password.encode())
        )
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        encrypted = base64.b64decode(ciphertext)
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()
```

#### Uso
```python
# Al agregar provider key
vault = KeyVault(settings.MASTER_ENCRYPTION_KEY)
encrypted_key = vault.encrypt(user_api_key)
db.save(provider_key, encrypted=encrypted_key)

# Al usar provider key
encrypted_key = db.get_provider_key(user_id, provider)
api_key = vault.decrypt(encrypted_key)
provider = OpenAIProvider(api_key)
```

---

### 7.2 JWT Authentication

**Uso**: Dashboard authentication.

#### Token Generation
```python
from jose import jwt

def create_access_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(
        payload, 
        settings.SECRET_KEY, 
        algorithm="HS256"
    )
    return token
```

#### Token Validation
```python
def verify_token(token: str):
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### Dependency
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    token: str = Depends(security)
):
    payload = verify_token(token.credentials)
    user = db.get_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

---

### 7.3 Gateway Key Authentication

**Uso**: Gateway API authentication.

#### Key Format
```
gw_ + 32 caracteres alfanuméricos aleatorios
Ejemplo: gw_abc123xyz789def456ghi012jkl345
```

#### Storage
```python
import hashlib

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

# Al crear key
raw_key = generate_secure_key()  # gw_abc123...
key_hash = hash_key(raw_key)
db.save(gateway_key, hash=key_hash, prefix=raw_key[:10])

# Al validar request
provided_key = request.headers["Authorization"].replace("Bearer ", "")
key_hash = hash_key(provided_key)
gateway_key = db.get_by_hash(key_hash)
if not gateway_key or not gateway_key.is_active:
    raise HTTPException(status_code=401)
```

---

### 7.4 Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/v1/chat/completions")
@limiter.limit("60/minute")
async def chat_completions(request: Request):
    ...
```

---

## 8. Flujo Principal de Requests

### Diagrama de Secuencia Completo

```
Cliente
  ↓
  POST /v1/chat/completions (Bearer gw_abc123...)
  ↓
Authentication Layer
  ↓ Validar gateway key
  ↓ Obtener user_id
  ↓
Cache Check
  ↓ Generar cache_key
  ↓ Buscar en cache
  ├─ HIT → Return cached response (fin)
  └─ MISS → Continuar
       ↓
Request Classifier
  ↓ Contar tokens
  ↓ Extraer features
  ↓ Clasificar complejidad → "moderate"
  ↓
Routing Engine
  ↓ Filtrar modelos disponibles
  ↓ Calcular scores
  ↓ Seleccionar mejor → "gpt-4o-mini"
  ↓
Provider Manager
  ↓ Obtener API key encriptada
  ↓ Desencriptar
  ↓ Instanciar OpenAIProvider
  ↓ Formatear request
  ↓ Hacer llamada HTTP
  ↓ Parsear response
  ↓
Post-Processing
  ↓ Calcular costo
  ↓ Guardar en cache
  ↓ Log en DB (request_logs)
  ↓ Actualizar last_used_at
  ↓
Response
  ↓ Retornar al cliente
  ↓
FIN
```

### Código del Endpoint Principal

```python
@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    gateway_key: str = Depends(verify_gateway_key)
):
    start_time = time.time()
    
    # 1. Check cache
    cached = cache_manager.get(request.messages, request.dict())
    if cached:
        return cached
    
    # 2. Classify request
    classification = classifier.classify(
        request.messages, 
        request.dict()
    )
    
    # 3. Route to best model
    routing = router.select_model(
        complexity=classification["complexity"],
        estimated_tokens=classification["estimated_tokens"],
        user_providers=get_user_providers(gateway_key.user_id),
        provider_health=get_provider_health()
    )
    
    # 4. Execute request
    provider_api_key = get_provider_key(
        gateway_key.user_id, 
        routing["provider"]
    )
    
    provider = get_provider_instance(
        routing["provider"], 
        provider_api_key
    )
    
    try:
        response = await provider.call(
            model=routing["model_id"],
            messages=request.messages,
            params=request.dict()
        )
    except Exception as e:
        # Try fallback
        if routing["fallbacks"]:
            response = await try_fallback(routing["fallbacks"])
        else:
            raise
    
    # 5. Calculate cost
    cost = calculate_cost(
        model=routing["model_id"],
        prompt_tokens=response["usage"]["prompt_tokens"],
        completion_tokens=response["usage"]["completion_tokens"]
    )
    
    # 6. Cache response
    cache_manager.set(request.messages, request.dict(), response)
    
    # 7. Log to database
    log_request(
        user_id=gateway_key.user_id,
        gateway_key_id=gateway_key.id,
        model=routing["model_id"],
        provider=routing["provider"],
        complexity=classification["complexity"],
        tokens=response["usage"],
        cost=cost,
        latency_ms=int((time.time() - start_time) * 1000),
        cache_hit=False
    )
    
    # 8. Return response
    return {
        **response,
        "metadata": {
            "model_used": routing["model_id"],
            "provider": routing["provider"],
            "cost_usd": cost,
            "latency_ms": int((time.time() - start_time) * 1000),
            "cache_hit": False,
            "complexity": classification["complexity"]
        }
    }
```

---

## 📝 Configuración y Variables de Entorno

### .env Example
```bash
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Database
DATABASE_URL=sqlite:///./data/gateway.db

# Security
SECRET_KEY=your-jwt-secret-key-min-32-chars
MASTER_ENCRYPTION_KEY=your-encryption-key-min-32-chars

# CORS
CORS_ORIGINS=http://localhost:3000

# Cache
CACHE_MAX_SIZE=1000
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60

# Logging
LOG_LEVEL=INFO
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
pip install -r requirements.txt

# Crear base de datos
python -m app.database init

# Correr servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Tests
pytest tests/ -v

# Formateo de código
black app/
isort app/
```

---

## 📦 Docker

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## ✅ Checklist de Implementación

### Core Functionality
- [ ] Database models (SQLAlchemy)
- [ ] Pydantic schemas (validation)
- [ ] Security (JWT, encryption, hashing)
- [ ] Request Classifier
- [ ] Routing Engine
- [ ] Cache Manager
- [ ] Provider adapters (OpenAI, Anthropic, Google)

### API Endpoints
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] GET /api/auth/me
- [ ] POST /api/keys/gateway
- [ ] GET /api/keys/gateway
- [ ] POST /api/keys/providers
- [ ] GET /api/keys/providers
- [ ] GET /api/analytics/overview
- [ ] GET /api/analytics/cost-breakdown
- [ ] GET /api/analytics/model-distribution
- [ ] POST /v1/chat/completions (PRINCIPAL)

### Testing
- [ ] Unit tests para classifier
- [ ] Unit tests para router
- [ ] Unit tests para cache
- [ ] Integration tests para endpoints
- [ ] Tests de seguridad

### Documentation
- [ ] README.md
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide

---

*Documento generado: 2026-01-13*
*Versión: 1.0*
