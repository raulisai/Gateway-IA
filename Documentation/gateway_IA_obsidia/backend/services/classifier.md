---
tags:
  - backend
  - classifier
  - service
type: documentation
layer: backend
title: Servicio de Clasificación
created: '2026-01-11'
---
# 🧠 Servicio de Clasificación

> El Classifier analiza la complejidad de cada request para determinar qué tipo de modelo es más apropiado.

## Concepto

```mermaid
graph LR
    Input[Request] --> Classifier[Classifier]
    Classifier --> Simple[SIMPLE]
    Classifier --> Moderate[MODERATE]
    Classifier --> Complex[COMPLEX]
    Classifier --> Expert[EXPERT]
```

## Niveles de Complejidad

| Nivel | Descripción | Modelos Recomendados |
|-------|-------------|---------------------|
| **SIMPLE** | Preguntas cortas, formateo | GPT-3.5, Gemini Flash |
| **MODERATE** | Conversaciones, resúmenes | GPT-4o-mini, Claude Haiku |
| **COMPLEX** | Análisis profundo, código | GPT-4o, Claude Sonnet |
| **EXPERT** | Tareas críticas | GPT-4, Claude Opus |

## Pipeline de Clasificación

```mermaid
graph TB
    Request[Request Body] --> Extract[Feature Extraction]
    
    Extract --> F1[Token Count]
    Extract --> F2[Message Depth]
    Extract --> F3[Code Detection]
    Extract --> F4[Keyword Analysis]
    
    F1 & F2 & F3 & F4 --> Rules[Rule Engine]
    Rules --> Output[Complexity Level]
```

## Reglas de Clasificación

```mermaid
flowchart TD
    Start[Features] --> Q1{Tokens mayor 10k?}
    
    Q1 -->|Sí| Expert[EXPERT]
    Q1 -->|No| Q2{Tiene código complejo?}
    
    Q2 -->|Sí| Complex[COMPLEX]
    Q2 -->|No| Q3{System prompt mayor 500 tokens?}
    
    Q3 -->|Sí| Moderate[MODERATE]
    Q3 -->|No| Q4{Tokens menor 500?}
    
    Q4 -->|Sí| Simple[SIMPLE]
    Q4 -->|No| Moderate
    
    style Simple fill:#27ae60
    style Moderate fill:#3498db
    style Complex fill:#f39c12
    style Expert fill:#e74c3c
```

## Detección de Código

El clasificador detecta la presencia y complejidad de código:

```mermaid
graph TB
    Content[Mensaje] --> Detect{Contiene Código?}
    
    Detect -->|Sí| Analyze[Analizar Complejidad]
    Detect -->|No| NoCode[Sin Código]
    
    Analyze --> SimpleCode[Código Simple<br/>Scripts cortos]
    Analyze --> ComplexCode[Código Complejo<br/>Funciones, clases]
    Analyze --> ArchCode[Arquitectura<br/>Sistemas completos]
    
    SimpleCode --> AddModerate[+1 Moderate]
    ComplexCode --> AddComplex[+1 Complex]
    ArchCode --> AddExpert[+1 Expert]
```

## Keywords por Nivel

### Simple
```
translate, format, list, define, hello, thanks
```

### Complex
```
analyze, compare, debug, optimize, architecture
```

### Expert
```
critical, production, compliance, security audit
```

## Interfaz

```python
class RequestClassifier:
    def classify(self, request: ChatRequest) -> ComplexityLevel:
        features = self.extract_features(request)
        return self.apply_rules(features)
    
    def extract_features(self, request: ChatRequest) -> Features:
        return Features(
            total_tokens=count_tokens(request),
            message_depth=len(request.messages),
            has_code=detect_code(request),
            keywords=extract_keywords(request)
        )
```

## Evolución Futura

```mermaid
graph LR
    V1[V1: Rule-Based<br/>Actual] --> V2[V2: ML Assisted<br/>Futuro]
    V2 --> V3[V3: Learned<br/>Auto-mejora]
```

---

*Ver también: [[router|Motor de Enrutamiento]] | [[../overview|Backend Overview]]*
