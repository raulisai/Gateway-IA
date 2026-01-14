---
title: Arquitectura General
type: architecture
created: '2026-01-11'
tags:
  - arquitectura
  - diseño
  - overview
---
# 🏗️ Arquitectura General - LLM Gateway

> Visión holística del sistema y cómo los componentes interactúan para proporcionar enrutamiento inteligente de LLMs.

## Filosofía de Diseño

El LLM Gateway sigue principios de arquitectura orientada a servicios con un enfoque en:

```mermaid
mindmap
  root((LLM Gateway))
    Modularidad
      Servicios desacoplados
      Interfaces bien definidas
      Componentes reemplazables
    Escalabilidad
      Cache inteligente
      Procesamiento async
      Rate limiting
    Observabilidad
      Métricas detalladas
      Logs estructurados
      Trazabilidad
    Seguridad
      Encriptación en reposo
      JWT Authentication
      Key rotation
```

## Vista de Alto Nivel

```mermaid
graph TB
    subgraph "Capa de Presentación"
        Browser[🌐 Browser]
        SDK[📦 SDK/CLI]
        ThirdParty[🔌 Third-party Apps]
    end
    
    subgraph "Capa de Gateway"
        LB[⚖️ Load Balancer]
        Frontend[🎨 Next.js Frontend]
        Backend[🔧 FastAPI Backend]
    end
    
    subgraph "Capa de Servicios"
        Auth[🔐 Auth Service]
        Classifier[🧠 Classifier]
        Router[🔀 Router]
        Cache[💾 Cache]
        Providers[🔗 Provider Manager]
        Scraper[🔄 Registry Scraper]
    end
    
    subgraph "Capa de Datos"
        SQLite[(💽 SQLite)]
        Registry[📋 Model Registry]
        Secrets[🔑 Key Vault]
    end
    
    subgraph "Servicios Externos"
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
        Google[Google AI API]
    end
    
    Browser --> LB
    SDK --> LB
    ThirdParty --> LB
    
    LB --> Frontend
    LB --> Backend
    
    Frontend --> Backend
    
    Backend --> Auth
    Backend --> Classifier
    Classifier --> Router
    Router --> Cache
    Cache --> Providers
    Backend --> Scraper
    
    Auth --> SQLite
    Router --> Registry
    Providers --> Secrets
    Scraper --> Registry
    
    Providers --> OpenAI
    Providers --> Anthropic
    Providers --> Google
    
    style Frontend fill:#61dafb
    style Backend fill:#009688
    style Classifier fill:#9b59b6
    style Router fill:#e74c3c
```

## Patrones Arquitectónicos Aplicados

### 1. Gateway Pattern
```mermaid
graph LR
    subgraph "Clientes"
        C1[App 1]
        C2[App 2]
        C3[App 3]
    end
    
    GW[🚪 Gateway<br/>Punto único de entrada]
    
    subgraph "Proveedores"
        P1[OpenAI]
        P2[Anthropic]
        P3[Google]
    end
    
    C1 & C2 & C3 --> GW
    GW --> P1 & P2 & P3
    
    style GW fill:#e74c3c,color:#fff
```

**Beneficios:**
- Abstracción de complejidad de múltiples proveedores
- API unificada para todos los clientes
- Centralización de cross-cutting concerns

### 2. Strategy Pattern (Router)
```mermaid
classDiagram
    class RoutingStrategy {
        <<interface>>
        +selectModel(request): Model
    }
    
    class CostOptimizedStrategy {
        +selectModel(request): Model
    }
    
    class PerformanceStrategy {
        +selectModel(request): Model
    }
    
    class QualityStrategy {
        +selectModel(request): Model
    }
    
    class Router {
        -strategy: RoutingStrategy
        +setStrategy(strategy)
        +route(request): Model
    }
    
    RoutingStrategy <|.. CostOptimizedStrategy
    RoutingStrategy <|.. PerformanceStrategy
    RoutingStrategy <|.. QualityStrategy
    Router --> RoutingStrategy
```

### 3. Chain of Responsibility (Request Pipeline)
```mermaid
graph LR
    REQ[Request] --> A[Auth<br/>Middleware]
    A --> B[Rate Limit<br/>Middleware]
    B --> C[Cache<br/>Middleware]
    C --> D[Classify<br/>Handler]
    D --> E[Route<br/>Handler]
    E --> F[Execute<br/>Handler]
    F --> RES[Response]
    
    style A fill:#e74c3c
    style B fill:#f39c12
    style C fill:#3498db
    style D fill:#9b59b6
    style E fill:#27ae60
```

## Comunicación Entre Componentes

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant B as Backend
    participant CL as Classifier
    participant RT as Router
    participant CA as Cache
    participant PM as Provider Manager
    participant LLM as LLM Provider
    
    C->>F: User Action
    F->>B: API Request
    B->>B: Authenticate
    B->>CA: Check Cache
    alt Cache Hit
        CA-->>B: Cached Response
        B-->>F: Return Cached
    else Cache Miss
        B->>CL: Classify Request
        CL-->>B: Complexity Level
        B->>RT: Select Model
        RT-->>B: Optimal Model
        B->>PM: Execute
        PM->>LLM: API Call
        LLM-->>PM: Response
        PM-->>B: Unified Response
        B->>CA: Store in Cache
        B-->>F: Return Response
    end
    F-->>C: Display Result
```

## Decisiones Arquitectónicas (ADRs)

### ADR-001: SQLite como Base de Datos Principal
**Contexto:** Necesitamos persistencia para usuarios, keys y logs.
**Decisión:** SQLite por simplicidad y portabilidad.
**Consecuencias:** 
- ✅ Zero-config, embebida
- ✅ Backup simple (copiar archivo)
- ⚠️ Limitaciones de concurrencia para escala extrema

### ADR-002: Scraping Directo vs GitHub Registry
**Contexto:** El catálogo de modelos cambia frecuentemente (precios, nuevos modelos).
**Decisión:** Implementar scrapers dentro del backend que consultan páginas oficiales de pricing, con cron job para ejecución automática.
**Consecuencias:**
- ✅ Datos siempre actualizados desde fuente oficial
- ✅ Sin dependencia de repos externos
- ✅ Control total sobre frecuencia de actualización
- ⚠️ Requiere mantenimiento si sitios cambian estructura
- ⚠️ Necesita fallback si scraping falla

### ADR-003: JSON para Model Registry Storage
**Contexto:** Necesitamos almacenar el catálogo actualizado de modelos.
**Decisión:** Archivo JSON versionado con backup automático.
**Consecuencias:**
- ✅ Actualizaciones sin redeploy
- ✅ Backup simple (models.json.bak)
- ✅ Fácil de parsear y validar
- ⚠️ No tiene queries complejas (pero no las necesitamos)

### ADR-004: Cron Job Dentro del Backend Container
**Contexto:** Registry updates deben ejecutarse automáticamente diariamente.
**Decisión:** Cron job dentro del contenedor backend (no contenedor separado).
**Consecuencias:**
- ✅ Arquitectura más simple (un contenedor menos)
- ✅ Endpoint manual disponible para updates on-demand
- ✅ Logs centralizados con el resto del backend
- ⚠️ Cron debe configurarse correctamente en Dockerfile

### ADR-005: Monorepo con Docker Compose
**Contexto:** Frontend y Backend son componentes separados.
**Decisión:** Monorepo con 2 servicios dockerizados (frontend + backend).
**Consecuencias:**
- ✅ Deploy unificado
- ✅ Desarrollo local simplificado
- ✅ Configuración centralizada
- ⚠️ Builds pueden ser largos

## Métricas de Arquitectura

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Latencia P99 | < 2000ms | TBD |
| Cache Hit Rate | > 30% | TBD |
| Disponibilidad | 99.9% | TBD |
| Tiempo de Recovery | < 5min | TBD |

## Documentos Relacionados

- [[backend-architecture|Arquitectura Backend]]
- [[frontend-architecture|Arquitectura Frontend]]
- [[data-architecture|Arquitectura de Datos]]
- [[deployment-architecture|Arquitectura de Deployment]]

---

*Ver también: [[../backend/overview|Backend Overview]] | [[../frontend/overview|Frontend Overview]]*
