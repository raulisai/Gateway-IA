---
tags:
  - roadmap
  - mvp
  - fase-1
type: roadmap
phase: 1
title: 'Fase 1: MVP'
created: '2026-01-11'
---
# 🎯 Fase 1: MVP

> Implementación del Producto Mínimo Viable que demuestre el valor del gateway.

## Objetivos

1. **Funcionalidad básica de gateway** - Recibir requests y enrutarlos
2. **Clasificación simple** - Determinar complejidad con reglas
3. **Dashboard básico** - Visualizar uso y costos
4. **Documentación** - Para demostrar a stakeholders

## Alcance MVP

```mermaid
graph TB
    subgraph "In Scope"
        R1[Routing básico]
        R2[2-3 Providers]
        R3[Auth JWT]
        R4[Dashboard simple]
        R5[API compatible OpenAI]
    end
    
    subgraph "Out of Scope"
        O1[ML Classifier]
        O2[Semantic Cache]
        O3[Streaming]
        O4[Multi-tenant]
        O5[Enterprise SSO]
    end
    
    style R1 fill:#27ae60
    style R2 fill:#27ae60
    style O1 fill:#e74c3c
    style O2 fill:#e74c3c
```

## Entregables

### Backend

| Entregable | Estado | Descripción |
|------------|--------|-------------|
| FastAPI setup | ✅ | Estructura base |
| Auth endpoints | ✅ | Login/Signup/Logout |
| Keys endpoints | 🔄 | Gateway + Provider keys |
| Gateway endpoint | 🔄 | /v1/chat/completions |
| Analytics endpoints | ⏳ | Overview + breakdown |
| SQLite schema | ✅ | Tablas base |
| Rule classifier | 🔄 | Clasificación básica |
| Simple router | 🔄 | Selección por reglas |

### Frontend

| Entregable | Estado | Descripción |
|------------|--------|-------------|
| Next.js setup | ✅ | Estructura base |
| Auth pages | ✅ | Login + Signup |
| Dashboard layout | 🔄 | Sidebar + Header |
| Metrics cards | ⏳ | KPIs principales |
| Cost chart | ⏳ | Line chart 7 días |
| Keys management | ⏳ | CRUD gateway keys |

### DevOps

| Entregable | Estado | Descripción |
|------------|--------|-------------|
| Docker setup | ✅ | Dockerfiles |
| Docker Compose | ✅ | Orquestación local |
| .env template | ✅ | Variables de entorno |
| README | 🔄 | Documentación básica |

## Arquitectura MVP

```mermaid
graph TB
    subgraph "MVP Architecture"
        Client[Client App]
        Frontend[Next.js<br/>Dashboard]
        Backend[FastAPI<br/>Gateway]
        DB[(SQLite)]
        
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
    end
    
    Client --> Backend
    Frontend --> Backend
    Backend --> DB
    Backend --> OpenAI
    Backend --> Anthropic
    
    style Backend fill:#009688
    style Frontend fill:#61dafb
```

## User Stories MVP

### Como Developer
- [ ] Puedo crear una cuenta
- [ ] Puedo generar gateway keys
- [ ] Puedo hacer requests al gateway
- [ ] Puedo ver mis costos

### Como Admin
- [ ] Puedo ver analytics básicos
- [ ] Puedo configurar provider keys
- [ ] Puedo ver requests recientes

## Criterios de Aceptación

```mermaid
graph LR
    A[Request recibido] --> B{Auth válido?}
    B -->|Sí| C[Clasificar]
    C --> D[Seleccionar modelo]
    D --> E[Ejecutar]
    E --> F[Retornar response]
    
    F --> Success[MVP Exitoso]
    
    style Success fill:#27ae60
```

1. ✅ Un developer puede registrarse y obtener una key
2. ✅ Puede agregar su OpenAI key
3. 🔄 Puede hacer requests y recibir responses
4. ⏳ Puede ver cuánto ha gastado
5. ⏳ El sistema elige el modelo según complejidad

## Timeline

```mermaid
gantt
    title Fase 1 MVP Timeline
    dateFormat YYYY-MM-DD
    
    section Backend
    Auth System       :done, 2026-01-01, 7d
    Key Management    :active, 2026-01-08, 7d
    Gateway Endpoint  :2026-01-15, 10d
    Analytics API     :2026-01-25, 5d
    
    section Frontend
    Auth Pages        :done, 2026-01-05, 5d
    Dashboard Layout  :active, 2026-01-10, 7d
    Metrics Display   :2026-01-17, 7d
    Keys Page         :2026-01-24, 5d
    
    section DevOps
    Docker Setup      :done, 2026-01-01, 3d
    Documentation     :2026-01-20, 10d
```

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Provider API changes | Media | Alto | Versionar adapters |
| Scope creep | Alta | Medio | Strict MVP boundaries |
| Performance issues | Baja | Alto | Basic caching |

---

*Ver también: [[roadmap-general|Roadmap]] | [[fase-2-features|Fase 2]]*
