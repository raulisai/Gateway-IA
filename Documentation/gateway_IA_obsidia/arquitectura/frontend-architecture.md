---
title: Arquitectura Frontend
type: architecture
layer: frontend
created: '2026-01-11'
tags:
  - arquitectura
  - frontend
  - nextjs
  - react
---
# 🎨 Arquitectura Frontend - Next.js

> El frontend proporciona una experiencia de usuario intuitiva para gestionar el gateway, visualizar analytics y administrar claves API.

## Visión General del Frontend

```mermaid
graph TB
    subgraph "Presentation Layer"
        Pages[Pages/Routes]
        Components[UI Components]
        Layouts[Layouts]
    end
    
    subgraph "Application Layer"
        Hooks[Custom Hooks]
        Context[React Context]
        State[State Management]
    end
    
    subgraph "Data Layer"
        API[API Client]
        Cache[React Query Cache]
        LocalStorage[Local Storage]
    end
    
    subgraph "Infrastructure"
        Backend[FastAPI Backend]
    end
    
    Pages --> Components
    Pages --> Layouts
    Components --> Hooks
    Hooks --> Context
    Hooks --> State
    State --> API
    API --> Cache
    API --> Backend
    
    style Pages fill:#61dafb
    style Hooks fill:#9b59b6
    style API fill:#27ae60
```

## Estructura de Directorios (App Router)

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page (/)
│   ├── globals.css             # Global styles
│   │
│   ├── (auth)/                 # Auth group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Auth layout
│   │
│   ├── (dashboard)/            # Dashboard group
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard
│   │   ├── keys/
│   │   │   └── page.tsx        # Key management
│   │   ├── analytics/
│   │   │   └── page.tsx        # Analytics
│   │   ├── models/
│   │   │   └── page.tsx        # Model catalog
│   │   ├── settings/
│   │   │   └── page.tsx        # Settings
│   │   └── layout.tsx          # Dashboard layout
│   │
│   └── api/                    # API routes (optional)
│
├── components/                 # React Components
│   ├── ui/                     # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/                 # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── dashboard/              # Dashboard components
│   │   ├── MetricsCard.tsx
│   │   ├── CostChart.tsx
│   │   ├── ModelDistribution.tsx
│   │   └── RequestsTable.tsx
│   │
│   ├── keys/                   # Key management
│   │   ├── KeyList.tsx
│   │   ├── KeyCreator.tsx
│   │   └── ProviderKeyForm.tsx
│   │
│   └── models/                 # Model components
│       ├── ModelCard.tsx
│       ├── ModelFilter.tsx
│       └── ModelCompare.tsx
│
├── lib/                        # Utilities
│   ├── api.ts                  # API client
│   ├── auth.ts                 # Auth utilities
│   ├── utils.ts                # Helper functions
│   └── constants.ts            # Constants
│
├── hooks/                      # Custom hooks
│   ├── useAuth.ts
│   ├── useMetrics.ts
│   ├── useKeys.ts
│   └── useModels.ts
│
├── types/                      # TypeScript types
│   ├── api.ts
│   ├── models.ts
│   └── user.ts
│
├── public/                     # Static assets
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Arquitectura de Componentes

```mermaid
graph TB
    subgraph "Root"
        RootLayout[Root Layout<br/>Providers, Theme]
    end
    
    subgraph "Auth Pages"
        AuthLayout[Auth Layout<br/>Centered, Clean]
        Login[Login Page]
        Signup[Signup Page]
    end
    
    subgraph "Dashboard Pages"
        DashLayout[Dashboard Layout<br/>Sidebar + Header]
        
        subgraph "Pages"
            Overview[Overview]
            Keys[Keys]
            Analytics[Analytics]
            Models[Models]
            Settings[Settings]
        end
    end
    
    subgraph "Shared Components"
        Header[Header]
        Sidebar[Sidebar]
        Footer[Footer]
    end
    
    RootLayout --> AuthLayout & DashLayout
    AuthLayout --> Login & Signup
    DashLayout --> Header & Sidebar
    DashLayout --> Overview & Keys & Analytics & Models & Settings
    
    style RootLayout fill:#61dafb
    style DashLayout fill:#9b59b6
```

## Árbol de Componentes del Dashboard

```mermaid
graph TB
    subgraph "DashboardPage"
        Page[Dashboard Page]
        
        subgraph "Metrics Row"
            MC1[MetricsCard<br/>Total Cost]
            MC2[MetricsCard<br/>Requests]
            MC3[MetricsCard<br/>Avg Latency]
            MC4[MetricsCard<br/>Cache Rate]
        end
        
        subgraph "Charts Row"
            CC[CostChart<br/>Line Chart<br/>7 days trend]
            MD[ModelDistribution<br/>Pie Chart<br/>Usage by model]
        end
        
        subgraph "Table"
            RT[RequestsTable<br/>Recent requests<br/>Paginated]
        end
    end
    
    Page --> MC1 & MC2 & MC3 & MC4
    Page --> CC & MD
    Page --> RT
    
    style Page fill:#61dafb
    style CC fill:#3498db
    style MD fill:#e74c3c
```

## Gestión de Estado

```mermaid
graph TB
    subgraph "Global State"
        AuthContext[Auth Context<br/>User, Token]
        ThemeContext[Theme Context<br/>Dark/Light]
    end
    
    subgraph "Server State - React Query"
        MetricsQuery[useMetrics()<br/>Dashboard data]
        KeysQuery[useKeys()<br/>API keys]
        ModelsQuery[useModels()<br/>Model catalog]
        AnalyticsQuery[useAnalytics()<br/>Charts data]
    end
    
    subgraph "Local State"
        FormState[Form State<br/>useState]
        UIState[UI State<br/>Modals, Filters]
    end
    
    Components[Components] --> AuthContext & ThemeContext
    Components --> MetricsQuery & KeysQuery & ModelsQuery & AnalyticsQuery
    Components --> FormState & UIState
    
    style AuthContext fill:#e74c3c
    style MetricsQuery fill:#3498db
```

## Flujo de Datos

### Data Fetching Pattern

```mermaid
sequenceDiagram
    participant C as Component
    participant H as useQuery Hook
    participant Q as React Query
    participant A as API Client
    participant B as Backend
    
    C->>H: Render component
    H->>Q: Check cache
    
    alt Cache Valid
        Q-->>H: Return cached data
        H-->>C: Data + isLoading: false
    else Cache Stale/Missing
        Q-->>H: Start fetch
        H-->>C: isLoading: true
        Q->>A: Fetch data
        A->>B: HTTP Request
        B-->>A: Response
        A-->>Q: Data
        Q->>Q: Update cache
        Q-->>H: Fresh data
        H-->>C: Data + isLoading: false
    end
    
    Note over Q: Background refetch<br/>on window focus
```

### Mutation Pattern (Creating/Updating)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Form
    participant M as useMutation
    participant A as API Client
    participant B as Backend
    participant Q as Query Cache
    
    U->>F: Submit form
    F->>F: Validate inputs
    F->>M: mutate(data)
    M-->>F: isPending: true
    M->>A: POST/PUT request
    A->>B: HTTP Request
    
    alt Success
        B-->>A: Success response
        A-->>M: Data
        M->>Q: Invalidate related queries
        Q->>Q: Refetch data
        M-->>F: isSuccess: true
        F->>F: Show success toast
        F->>F: Reset/redirect
    else Error
        B-->>A: Error response
        A-->>M: Error
        M-->>F: isError: true
        F->>F: Show error message
    end
```

## Diseño de API Client

```mermaid
classDiagram
    class APIClient {
        -baseURL: string
        -token: string
        +setToken(token)
        +get(endpoint): Promise
        +post(endpoint, data): Promise
        +put(endpoint, data): Promise
        +delete(endpoint): Promise
        -handleResponse(response)
        -handleError(error)
    }
    
    class AuthAPI {
        +login(email, password)
        +signup(data)
        +logout()
        +refreshToken()
    }
    
    class KeysAPI {
        +getGatewayKeys()
        +createGatewayKey(name)
        +revokeGatewayKey(id)
        +getProviderKeys()
        +addProviderKey(provider, key)
    }
    
    class AnalyticsAPI {
        +getOverview(timeframe)
        +getCostBreakdown(days)
        +getModelDistribution()
        +getRequests(page, limit)
    }
    
    class ModelsAPI {
        +getModels(filters)
        +getModel(id)
        +compareModels(ids)
    }
    
    APIClient <|-- AuthAPI
    APIClient <|-- KeysAPI
    APIClient <|-- AnalyticsAPI
    APIClient <|-- ModelsAPI
```

## Componentes UI (Shadcn)

```mermaid
graph LR
    subgraph "Primitives"
        Button[Button]
        Input[Input]
        Card[Card]
        Badge[Badge]
        Avatar[Avatar]
    end
    
    subgraph "Forms"
        Form[Form]
        Select[Select]
        Checkbox[Checkbox]
        Switch[Switch]
    end
    
    subgraph "Feedback"
        Toast[Toast]
        Alert[Alert]
        Dialog[Dialog]
        Sheet[Sheet]
    end
    
    subgraph "Data Display"
        Table[Table]
        Tabs[Tabs]
        Skeleton[Skeleton]
    end
    
    subgraph "Charts"
        LineChart[Line Chart]
        PieChart[Pie Chart]
        BarChart[Bar Chart]
    end
    
    style Button fill:#61dafb
    style Toast fill:#27ae60
    style Table fill:#9b59b6
```

## Routing y Navigation

```mermaid
graph TB
    subgraph "Public Routes"
        Landing[/ Landing]
        Login[/auth/login]
        Signup[/auth/signup]
    end
    
    subgraph "Protected Routes"
        Dashboard[/dashboard]
        Keys[/dashboard/keys]
        Analytics[/dashboard/analytics]
        Models[/dashboard/models]
        Settings[/dashboard/settings]
    end
    
    subgraph "Middleware"
        AuthGuard{Auth Guard}
    end
    
    Landing --> Login
    Login -->|Success| AuthGuard
    Signup -->|Success| AuthGuard
    
    AuthGuard -->|Has Token| Dashboard
    AuthGuard -->|No Token| Login
    
    Dashboard --> Keys & Analytics & Models & Settings
    
    style AuthGuard fill:#e74c3c
    style Dashboard fill:#27ae60
```

## Responsive Design

```mermaid
graph LR
    subgraph "Mobile (< 768px)"
        MobileNav[Bottom Nav]
        MobileCards[Stacked Cards]
        MobileTable[Card List]
    end
    
    subgraph "Tablet (768-1024px)"
        TabletNav[Collapsible Sidebar]
        TabletGrid[2-Column Grid]
        TabletTable[Scrollable Table]
    end
    
    subgraph "Desktop (> 1024px)"
        DesktopNav[Full Sidebar]
        DesktopGrid[4-Column Grid]
        DesktopTable[Full Table]
    end
    
    style MobileNav fill:#3498db
    style TabletNav fill:#9b59b6
    style DesktopNav fill:#27ae60
```

## Performance Optimizations

| Técnica | Implementación |
|---------|----------------|
| Code Splitting | Dynamic imports por ruta |
| Image Optimization | next/image component |
| Caching | React Query con staleTime |
| Memoization | useMemo, useCallback |
| Lazy Loading | Suspense boundaries |
| Prefetching | Link prefetch |

## Documentos Relacionados

- [[../frontend/overview|Frontend Overview]]
- [[../frontend/components/dashboard|Dashboard Components]]
- [[../frontend/state-management|State Management]]
- [[../frontend/api-client|API Client]]

---

*Ver también: [[overview|Arquitectura General]] | [[backend-architecture|Arquitectura Backend]]*
