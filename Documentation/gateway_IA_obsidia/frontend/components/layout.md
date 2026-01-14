---
tags:
  - frontend
  - components
  - layout
type: documentation
layer: frontend
title: Layout Components
created: '2026-01-11'
---
# 🧱 Layout Components

> Componentes de estructura que definen el layout base de la aplicación.

## Estructura de Layouts

```mermaid
graph TB
    Root[RootLayout] --> AuthLayout[AuthLayout]
    Root --> DashLayout[DashboardLayout]
    
    AuthLayout --> Center[Centered Container]
    Center --> Card[Auth Card]
    
    DashLayout --> Header
    DashLayout --> Sidebar
    DashLayout --> Main[Main Content]
    DashLayout --> Footer
```

## RootLayout

Wrapper principal que provee providers globales.

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

## DashboardLayout

```mermaid
graph TB
    subgraph "DashboardLayout"
        direction LR
        
        subgraph "Sidebar"
            Logo[Logo]
            Nav[Navigation]
            User[User Section]
        end
        
        subgraph "Main Area"
            Header[Header Bar]
            Content[Page Content]
        end
    end
```

## Header Component

```mermaid
graph LR
    Header --> MenuToggle[Menu Toggle]
    Header --> Breadcrumb[Breadcrumb]
    Header --> Spacer[Spacer]
    Header --> Search[Search]
    Header --> Notifications[Notifications]
    Header --> UserMenu[User Menu]
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Título de la página |
| `breadcrumb` | array | Items del breadcrumb |
| `actions` | ReactNode | Acciones adicionales |

## Sidebar Component

```mermaid
graph TB
    Sidebar --> Logo[Logo/Brand]
    Sidebar --> NavSection1[Main Navigation]
    Sidebar --> NavSection2[Analytics]
    Sidebar --> NavSection3[Settings]
    Sidebar --> UserCard[User Card]
    
    NavSection1 --> Dashboard[Dashboard]
    NavSection1 --> Keys[API Keys]
    NavSection1 --> Models[Models]
    
    NavSection2 --> Analytics[Analytics]
    NavSection2 --> Usage[Usage]
    
    NavSection3 --> Settings[Settings]
    NavSection3 --> Docs[Documentation]
```

### Navigation Items

```typescript
const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "API Keys",
    icon: Key,
    href: "/dashboard/keys",
  },
  {
    title: "Models",
    icon: Cpu,
    href: "/dashboard/models",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];
```

## AuthLayout

```mermaid
graph TB
    AuthLayout --> Background[Gradient Background]
    AuthLayout --> Container[Centered Container]
    
    Container --> Card[Auth Card]
    Card --> Logo
    Card --> Title
    Card --> Form
    Card --> Links[Auth Links]
```

## Responsive Behavior

```mermaid
graph LR
    subgraph "Mobile"
        M1[Hidden Sidebar]
        M2[Sheet Drawer]
        M3[Bottom Nav]
    end
    
    subgraph "Tablet"
        T1[Collapsed Icons]
        T2[Hover Expand]
    end
    
    subgraph "Desktop"
        D1[Full Sidebar]
        D2[Always Visible]
    end
```

## Implementación

```tsx
// components/layout/DashboardLayout.tsx
export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

*Ver también: [[dashboard|Dashboard Components]] | [[../overview|Frontend Overview]]*
