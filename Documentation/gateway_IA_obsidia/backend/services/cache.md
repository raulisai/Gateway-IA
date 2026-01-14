---
tags:
  - backend
  - cache
  - service
  - performance
type: documentation
layer: backend
title: Sistema de Cache
created: '2026-01-11'
---
# 💾 Sistema de Cache

> Cache inteligente para reducir costos y latencia mediante almacenamiento de respuestas frecuentes.

## Concepto

```mermaid
graph LR
    Request[Request] --> Check{Cache Hit?}
    Check -->|Sí| Return[Retornar Cached]
    Check -->|No| Process[Procesar Request]
    Process --> Store[Guardar en Cache]
    Store --> Return
```

## Arquitectura del Cache

```mermaid
graph TB
    subgraph "Cache Layer"
        LRU[LRU Cache<br/>In-Memory]
        Semantic[Semantic Cache<br/>Similarity-based]
    end
    
    subgraph "Storage"
        Memory[RAM<br/>Fast Access]
        Redis[Redis<br/>Distributed - Future]
    end
    
    Request --> LRU
    LRU -->|Miss| Semantic
    Semantic -->|Miss| Backend[Process Request]
    
    LRU --> Memory
    Semantic --> Memory
    
    style LRU fill:#27ae60
    style Semantic fill:#3498db,stroke-dasharray: 5 5
```

## Generación de Cache Key

```mermaid
graph LR
    Messages[Messages Array] --> Normalize[Normalizar]
    Params[Parameters] --> Normalize
    
    Normalize --> Hash[SHA-256 Hash]
    Hash --> Key[Cache Key]
```

```python
def generate_cache_key(request: ChatRequest) -> str:
    # Normalizar mensajes
    normalized = {
        "messages": [
            {"role": m.role, "content": m.content.strip().lower()}
            for m in request.messages
        ],
        "params": {
            "temperature": request.temperature or 1.0,
            "max_tokens": request.max_tokens
        }
    }
    
    # Generar hash
    content = json.dumps(normalized, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()[:32]
```

## Flujo de Cache

```mermaid
sequenceDiagram
    participant Handler
    participant Cache
    participant Backend
    
    Handler->>Cache: get(key)
    
    alt Cache Hit
        Cache-->>Handler: Cached Response
        Handler->>Handler: Update stats (hit)
    else Cache Miss
        Cache-->>Handler: None
        Handler->>Backend: Process request
        Backend-->>Handler: Response
        Handler->>Cache: set(key, response, ttl)
        Handler->>Handler: Update stats (miss)
    end
```

## LRU Eviction

```mermaid
graph TB
    subgraph "LRU Cache (max_size=1000)"
        Most[Most Recently Used]
        Item1[Item 1]
        Item2[Item 2]
        ItemN[Item N...]
        Least[Least Recently Used]
    end
    
    New[New Item] --> Full{Cache Full?}
    Full -->|No| Add[Add to Top]
    Full -->|Sí| Evict[Evict LRU]
    Evict --> Add
    
    Access[Access Item] --> Move[Move to Top]
```

## Configuración

```python
class CacheConfig:
    # Tamaño máximo de items
    max_size: int = 1000
    
    # TTL por defecto (segundos)
    default_ttl: int = 3600  # 1 hora
    
    # TTL por tipo de request
    ttl_by_complexity: dict = {
        "simple": 7200,     # 2 horas
        "moderate": 3600,   # 1 hora
        "complex": 1800,    # 30 min
        "expert": 900       # 15 min
    }
    
    # No cachear si response > X tokens
    max_response_tokens: int = 4000
```

## Métricas de Cache

```mermaid
xychart-beta
    title "Cache Performance"
    x-axis [Hour 1, Hour 2, Hour 3, Hour 4, Hour 5]
    y-axis "Rate %" 0 --> 100
    line "Hit Rate" [35, 42, 48, 45, 52]
```

| Métrica | Descripción |
|---------|-------------|
| `cache_hits_total` | Total de cache hits |
| `cache_misses_total` | Total de cache misses |
| `cache_hit_rate` | Porcentaje de hits |
| `cache_size` | Items actuales en cache |
| `cache_evictions_total` | Evictions realizadas |

## Semantic Cache (Futuro)

```mermaid
graph TB
    Query[Nueva Query] --> Embed[Generar Embedding]
    Embed --> Search[Buscar Similares]
    Search --> Threshold{Similarity mayor 0.95?}
    
    Threshold -->|Sí| Return[Retornar Cached]
    Threshold -->|No| Process[Procesar Normalmente]
    
    Process --> Store[Almacenar con Embedding]
```

## Interfaz

```python
class CacheManager:
    def __init__(self, config: CacheConfig):
        self.cache = LRUCache(maxsize=config.max_size)
        self.config = config
        self.stats = CacheStats()
    
    async def get(self, key: str) -> CachedResponse | None:
        if item := self.cache.get(key):
            if not self._is_expired(item):
                self.stats.record_hit()
                return item.response
            self.cache.pop(key)
        self.stats.record_miss()
        return None
    
    async def set(
        self, 
        key: str, 
        response: ChatResponse,
        complexity: str
    ) -> None:
        ttl = self.config.ttl_by_complexity.get(complexity, 3600)
        self.cache[key] = CachedItem(
            response=response,
            expires_at=time.time() + ttl
        )
```

---

*Ver también: [[router|Router]] | [[../overview|Backend Overview]]*
