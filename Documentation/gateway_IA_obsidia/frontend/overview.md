---
tags:
  - frontend
  - nextjs
  - overview
type: documentation
layer: frontend
title: Frontend Overview
created: '2026-01-11'
---
# 🎨 Frontend Overview

> Aplicación Next.js que proporciona el dashboard de gestión, analytics y configuración del gateway.

## Resumen

```mermaid
mindmap
  root((Frontend<br/>Next.js))
    Pages
      Landing
      Auth
      Dashboard
      Keys
      Analytics
      Models
      Settings
    Components
      Layout
      Dashboard
      Forms
      Charts
    State
      React Query
      Context
    API Client
      Auth
      Keys
      Analytics
      Models
```

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 14 (App Router) |
| UI Library | React 18 |
| Styling | Tailwind CSS |
| Components | Shadcn/ui |
| State | React Query |
| Charts | Recharts |
| Forms | React Hook Form |
| Validation | Zod |

## Estructura de Rutas

```mermaid
graph TB
    subgraph "Public"
        Landing[/ Landing]
        Login[/auth/login]
        Signup[/auth/signup]
    end
    
    subgraph "Protected"
        Dashboard[/dashboard]
        Keys[/dashboard/keys]
        Analytics[/dashboard/analytics]
        Models[/dashboard/models]
        Settings[/dashboard/settings]
    end
    
    Landing --> Login
    Login --> Dashboard
    Dashboard --> Keys & Analytics & Models & Settings
    
    style Dashboard fill:#61dafb
```

## Árbol de Componentes

```mermaid
graph TB
    Root[RootLayout] --> AuthLayout
    Root --> DashLayout
    
    AuthLayout --> LoginPage
    AuthLayout --> SignupPage
    
    DashLayout --> Header
    DashLayout --> Sidebar
    DashLayout --> Content
    
    Content --> DashboardPage
    Content --> KeysPage
    Content --> AnalyticsPage
    Content --> ModelsPage
    
    DashboardPage --> MetricsCards
    DashboardPage --> CostChart
    DashboardPage --> ModelPie
    DashboardPage --> RequestsTable
```

## Flujo de Datos

```mermaid
sequenceDiagram
    participant UI as Component
    participant Hook as useQuery Hook
    participant Cache as React Query
    participant API as API Client
    participant Backend
    
    UI->>Hook: Render
    Hook->>Cache: Check cache
    
    alt Fresh data
        Cache-->>UI: Return cached
    else Stale/Missing
        Cache->>API: Fetch
        API->>Backend: HTTP Request
        Backend-->>API: Response
        API-->>Cache: Update cache
        Cache-->>UI: Fresh data
    end
```

## Componentes Principales

### Layout Components
- **Header**: Navegación superior, user menu
- **Sidebar**: Navegación lateral
- **Footer**: Links, copyright

### Dashboard Components
- **MetricsCard**: KPIs principales
- **CostChart**: Gráfico de costos
- **ModelDistribution**: Pie chart de uso
- **RequestsTable**: Lista de requests

### Key Components
- **KeyList**: Lista de gateway keys
- **KeyCreator**: Modal crear key
- **ProviderKeyForm**: Agregar provider keys

### Model Components
- **ModelCard**: Card de modelo
- **ModelFilter**: Filtros de búsqueda
- **ModelCompare**: Comparador

## API Client

```mermaid
classDiagram
    class APIClient {
        -baseURL
        -token
        +get(endpoint)
        +post(endpoint, data)
        +delete(endpoint)
    }
    
    class AuthAPI {
        +login(email, password)
        +signup(data)
        +logout()
    }
    
    class KeysAPI {
        +getGatewayKeys()
        +createKey(name)
        +revokeKey(id)
    }
    
    class AnalyticsAPI {
        +getOverview(timeframe)
        +getCostBreakdown(days)
    }
    
    APIClient <|-- AuthAPI
    APIClient <|-- KeysAPI
    APIClient <|-- AnalyticsAPI
```

## Custom Hooks

```typescript
// useAuth - Autenticación
const { user, login, logout, isLoading } = useAuth();

// useMetrics - Dashboard metrics
const { data, isLoading, error } = useMetrics(timeframe);

// useKeys - Gateway keys
const { keys, create, revoke } = useKeys();

// useModels - Model catalog
const { models, filters, setFilters } = useModels();
```

## Estado Global

```mermaid
graph TB
    subgraph "Context Providers"
        Auth[AuthProvider<br/>User, Token]
        Theme[ThemeProvider<br/>Dark/Light]
        Toast[ToastProvider<br/>Notifications]
    end
    
    subgraph "React Query"
        QueryClient[QueryClientProvider]
        Queries[Cached Queries]
        Mutations[Mutations]
    end
    
    App --> Auth --> Theme --> Toast --> QueryClient
    QueryClient --> Queries & Mutations
```

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Stacked, bottom nav |
| Tablet (768-1024px) | Collapsible sidebar |
| Desktop (> 1024px) | Full sidebar |

## Documentos Relacionados

- [[components/layout|Layout Components]]
- [[components/dashboard|Dashboard Components]]
- [[state-management|State Management]]
- [[api-client|API Client]]

---

*Ver también: [[../arquitectura/frontend-architecture|Arquitectura Frontend]]*
