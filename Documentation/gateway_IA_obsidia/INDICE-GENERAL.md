---
title: Índice General - LLM Gateway
type: index
created: 2026-01-14
tags:
  - index
  - navigation
  - overview
---

# 📚 Índice General - LLM Gateway IA

> Navegación completa de toda la documentación del proyecto

## 🚀 Documentos de Inicio

**Para empezar rápidamente:**

1. [[RESUMEN-EJECUTIVO-ACTUALIZADO|📊 Resumen Ejecutivo]] - Vista general simplificada (RECOMENDADO)
2. [[RESUMEN-INTEGRAL|📄 Resumen Integral]] - Visión completa del proyecto
3. [[ROADMAP-50-CHECKPOINTS|✅ Roadmap de 50 Checkpoints]] - Plan de implementación paso a paso
4. [[GUIA-TECNICA-IMPLEMENTACION|📘 Guía Técnica]] - Detalles técnicos por componente

---

## 🏗️ Arquitectura

### Documentos Principales
- [[arquitectura/overview|Vista General]] - Filosofía de diseño y patrones
- [[arquitectura/backend-architecture|Backend]] - FastAPI, servicios, pipeline
- [[arquitectura/frontend-architecture|Frontend]] - Next.js, componentes, estado
- [[arquitectura/data-architecture|Datos]] - SQLite, modelos, relaciones
- [[arquitectura/deployment-architecture|Deployment]] - Docker, infraestructura

### Diagramas Clave
```
📊 Arquitectura General
├── Sistema de 2 contenedores (Frontend + Backend)
├── Pipeline de procesamiento de requests
├── Comunicación entre componentes
└── Flujo de datos completo

🔧 Backend
├── Capas: API → Middleware → Service → Data
├── Clasificador de complejidad
├── Motor de enrutamiento
└── Sistema de scrapers (🆕 actualizado)

🎨 Frontend
├── Dashboard de métricas
├── Gestión de keys
└── Catálogo de modelos
```

---

## 🔙 Backend

### Core Services
- [[backend/overview|Overview General]]
- [[backend/services/classifier|Classifier Service]] - Análisis de complejidad
- [[backend/services/router|Router Engine]] - Selección de modelos
- [[backend/services/cache|Cache Manager]] - LRU cache con TTL
- [[backend/services/providers|Provider Adapters]] - OpenAI, Anthropic, Google
- [[backend/services/registry-scraper|Registry Scraper]] 🆕 - Sistema de actualización

### Otros Componentes
- [[backend/api-routes|API Routes]] - Endpoints REST
- [[backend/security|Security]] - JWT, encriptación, Key Vault
- [[backend/database|Database]] - Modelos SQLAlchemy, schema

---

## 🎨 Frontend

### Documentos
- [[frontend/overview|Overview General]]
- Componentes (por documentar)
- State Management (por documentar)
- API Client (por documentar)

---

## 📖 Documentación Técnica

- API Reference (por documentar)
- Setup Guide (por documentar)
- Configuration (por documentar)
- Troubleshooting (por documentar)

---

## 📄 Documentación No Técnica

- Visión del Producto (por documentar)
- Modelo de Negocio (por documentar)
- User Stories (por documentar)
- FAQ (por documentar)

---

## 🗺️ Roadmap y Planificación

- [[ROADMAP-50-CHECKPOINTS|Roadmap de 50 Checkpoints]]
- Roadmap General (por documentar)
- Fase 1: MVP (por documentar)
- Fase 2: Features (por documentar)
- Fase 3: Escalabilidad (por documentar)

---

## ✅ Tareas

- Backlog (por documentar)
- Sprint Actual (por documentar)
- Completadas (por documentar)

---

## 🧪 Testing

- Estrategia de Testing (por documentar)
- Backend Tests (por documentar)
- Frontend Tests (por documentar)
- E2E Tests (por documentar)

---

## 🔍 Búsqueda por Tema

### Autenticación y Seguridad
- [[backend/security#JWT Authentication|JWT Authentication]]
- [[backend/security#Key Vault|Encriptación de API Keys]]
- [[backend/api-routes#Auth Routes|Endpoints de Auth]]

### Clasificación y Routing
- [[backend/services/classifier|Request Classifier]]
- [[backend/services/router|Routing Engine]]
- [[arquitectura/backend-architecture#Sistema de Clasificación|Flujo de Clasificación]]

### Cache y Performance
- [[backend/services/cache|Cache Manager]]
- [[arquitectura/backend-architecture#Cache Layer|Arquitectura de Cache]]

### Registry y Modelos
- [[backend/services/registry-scraper|Registry Scraper System]] 🆕
- [[arquitectura/deployment-architecture#Registry Updates|Deployment del Scraper]]
- [[GUIA-TECNICA-IMPLEMENTACION#PARTE 6|Guía de Implementación]]

### Proveedores LLM
- [[backend/services/providers#OpenAI|OpenAI Adapter]]
- [[backend/services/providers#Anthropic|Anthropic Adapter]]
- [[backend/services/providers#Google|Google Adapter]]

### Analytics
- Dashboard (por documentar)
- Cost Tracking (por documentar)
- Metrics (por documentar)

---

## 📊 Estado del Proyecto

```
✅ Documentado completamente
├── Arquitectura general
├── Backend core services
├── Registry scraper system
├── Roadmap 50 checkpoints
└── Guía técnica

🔄 En progreso
├── Documentación de frontend
├── API reference
└── Setup guides

⏳ Pendiente
├── Tests documentation
├── User stories
└── FAQ
```

---

## 🔗 Enlaces Rápidos por Rol

### Para Desarrolladores Backend
1. [[arquitectura/backend-architecture|Backend Architecture]]
2. [[backend/services/classifier|Classifier]]
3. [[backend/services/router|Router]]
4. [[backend/services/registry-scraper|Registry Scraper]]
5. [[ROADMAP-50-CHECKPOINTS#Fase 1|Fase 1: Backend Core]]

### Para Desarrolladores Frontend
1. [[arquitectura/frontend-architecture|Frontend Architecture]]
2. [[frontend/overview|Frontend Overview]]
3. [[ROADMAP-50-CHECKPOINTS#Fase 3|Fase 3: Frontend Dashboard]]

### Para DevOps
1. [[arquitectura/deployment-architecture|Deployment Architecture]]
2. [[ROADMAP-50-CHECKPOINTS#Fase 5|Fase 5: Testing y Producción]]

### Para Product Managers
1. [[RESUMEN-EJECUTIVO-ACTUALIZADO|Resumen Ejecutivo]]
2. [[RESUMEN-INTEGRAL|Resumen Integral]]
3. Visión del Producto (por documentar)

---

## 📝 Convenciones de Documentación

### Emojis Utilizados
- 🏗️ Arquitectura
- 🔧 Backend
- 🎨 Frontend
- 📊 Datos/Analytics
- 🔐 Seguridad
- ✅ Completado
- 🔄 En progreso
- ⏳ Pendiente
- 🆕 Nuevo/Actualizado
- ⚠️ Importante

### Tags Comunes
- `#arquitectura` - Diseño del sistema
- `#backend` - Backend services
- `#frontend` - Frontend components
- `#service` - Servicio específico
- `#roadmap` - Planificación
- `#guide` - Guías de implementación

---

*Última actualización: 2026-01-14*
*Mantener este índice actualizado con cada nuevo documento*
