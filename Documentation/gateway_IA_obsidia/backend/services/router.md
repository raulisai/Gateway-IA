---
tags:
  - backend
  - router
  - service
type: documentation
layer: backend
title: Motor de Enrutamiento
created: '2026-01-11'
---
# 🔀 Motor de Enrutamiento

> El Router selecciona el modelo óptimo basándose en complejidad, costo, disponibilidad y preferencias del usuario.

## Concepto

```mermaid
graph TB
    Input[Complexity + Config] --> Router[Router Engine]
    
    Router --> Filter[Filter Models]
    Filter --> Score[Score Models]
    Score --> Select[Select Best]
    
    Select --> Primary[Primary Model]
    Select --> Fallbacks[Fallback Models]
```

## Pipeline de Selección

```mermaid
flowchart TD
    Start[Nivel de Complejidad] --> Load[Cargar Modelos Disponibles]
    
    Load --> F1{Context Window Suficiente?}
    F1 -->|No| Remove1[Remover Modelo]
    F1 -->|Sí| F2{Provider Saludable?}
    
    F2 -->|No| Remove2[Remover Modelo]
    F2 -->|Sí| F3{Bajo Rate Limit?}
    
    F3 -->|No| Remove3[Remover Modelo]
    F3 -->|Sí| F4{Usuario tiene Key?}
    
    F4 -->|No| Remove4[Remover Modelo]
    F4 -->|Sí| Score[Calcular Score]
    
    Remove1 & Remove2 & Remove3 & Remove4 --> NextModel[Siguiente Modelo]
    NextModel --> F1
    
    Score --> Rank[Ordenar por Score]
    Rank --> Best[Seleccionar Mejor]
```

## Sistema de Scoring

```mermaid
pie title Peso de Factores
    "Costo" : 40
    "Calidad" : 35
    "Velocidad" : 25
```

### Cálculo de Score

```python
def calculate_score(model, complexity, user_config):
    cost_score = calculate_cost_score(model)      # 0-100
    quality_score = calculate_quality_score(model, complexity)  # 0-100
    speed_score = calculate_speed_score(model)    # 0-100
    
    # Pesos configurables por usuario
    weights = user_config.weights or DEFAULT_WEIGHTS
    
    total = (
        cost_score * weights.cost +      # 40%
        quality_score * weights.quality + # 35%
        speed_score * weights.speed       # 25%
    )
    
    return total
```

## Mapeo Complejidad → Modelos

```mermaid
graph LR
    subgraph "SIMPLE"
        S1[GPT-3.5 Turbo]
        S2[Gemini Flash]
        S3[Claude Instant]
    end
    
    subgraph "MODERATE"
        M1[GPT-4o-mini]
        M2[Claude Haiku]
        M3[Gemini Pro]
    end
    
    subgraph "COMPLEX"
        C1[GPT-4o]
        C2[Claude Sonnet]
        C3[Gemini Ultra]
    end
    
    subgraph "EXPERT"
        E1[GPT-4 Turbo]
        E2[Claude Opus]
        E3[o1-preview]
    end
```

## Estrategias de Routing

```mermaid
classDiagram
    class RoutingStrategy {
        +select_model(request, models)
    }
    
    class CostOptimized {
        +select_model()
        Prioriza menor costo
    }
    
    class QualityFirst {
        +select_model()
        Prioriza mejor calidad
    }
    
    class Balanced {
        +select_model()
        Balance costo-calidad
    }
    
    class ProviderPreference {
        +preferred_provider
        +select_model()
    }
    
    RoutingStrategy <|-- CostOptimized
    RoutingStrategy <|-- QualityFirst
    RoutingStrategy <|-- Balanced
    RoutingStrategy <|-- ProviderPreference
```

## Health Checking

```mermaid
graph TB
    subgraph "Provider Health"
        OpenAI[OpenAI<br/>Status: Healthy]
        Anthropic[Anthropic<br/>Status: Healthy]
        Google[Google<br/>Status: Degraded]
    end
    
    Health[Health Monitor] --> OpenAI
    Health --> Anthropic
    Health --> Google
    
    OpenAI --> Available[Disponible]
    Anthropic --> Available
    Google --> Cooldown[Cooldown: 5min]
    
    style Google fill:#f39c12
```

## Fallback Logic

```mermaid
sequenceDiagram
    participant Router
    participant Primary as Primary Model
    participant Fallback1 as Fallback 1
    participant Fallback2 as Fallback 2
    
    Router->>Primary: Intentar
    alt Éxito
        Primary-->>Router: Response
    else Fallo
        Router->>Fallback1: Intentar
        alt Éxito
            Fallback1-->>Router: Response
        else Fallo
            Router->>Fallback2: Intentar
            Fallback2-->>Router: Response o Error
        end
    end
```

## Configuración de Usuario

```yaml
user_routing_config:
  strategy: "balanced"  # cost_optimized | quality_first | balanced
  
  weights:
    cost: 0.40
    quality: 0.35
    speed: 0.25
  
  preferences:
    preferred_provider: "openai"  # optional
    avoid_providers: []           # optional
    
  limits:
    max_cost_per_request: 0.10   # USD
    max_latency_ms: 5000
```

## Interfaz

```python
class RoutingEngine:
    def select_model(
        self,
        complexity: ComplexityLevel,
        user_config: UserRoutingConfig,
        request_context: RequestContext
    ) -> RoutingResult:
        
        # 1. Get candidate models
        candidates = self.registry.get_models_for_complexity(complexity)
        
        # 2. Apply filters
        candidates = self.filter_by_context_window(candidates, request_context)
        candidates = self.filter_by_health(candidates)
        candidates = self.filter_by_user_keys(candidates, user_config)
        
        # 3. Score and rank
        scored = [(m, self.score(m, user_config)) for m in candidates]
        ranked = sorted(scored, key=lambda x: x[1], reverse=True)
        
        # 4. Return best + fallbacks
        return RoutingResult(
            primary=ranked[0][0],
            fallbacks=[m for m, _ in ranked[1:4]]
        )
```

---

*Ver también: [[classifier|Clasificador]] | [[providers|Providers]]*
