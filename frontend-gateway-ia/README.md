# Gateway IA - Frontend

Frontend de Next.js 14 para el sistema de gestión de APIs de IA.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Formularios**: React Hook Form + Zod
- **Peticiones HTTP**: Axios
- **State Management**: TanStack Query (React Query)

## 📁 Estructura del Proyecto

```
app/
├── layout.tsx                 # Layout principal con providers
├── page.tsx                   # Landing page
├── auth/
│   ├── login/page.tsx        # Página de inicio de sesión
│   └── signup/page.tsx       # Página de registro
└── dashboard/
    ├── layout.tsx            # Layout con sidebar
    ├── page.tsx              # Dashboard principal
    ├── keys/page.tsx         # Gestión de API keys
    └── settings/page.tsx     # Configuración

components/
├── auth/
│   └── auth-guard.tsx        # Protección de rutas
├── navigation/
│   └── sidebar.tsx           # Sidebar de navegación
├── providers.tsx             # React Query provider
└── ui/                       # Componentes shadcn/ui

lib/
├── api.ts                    # Cliente Axios configurado
├── auth.ts                   # Servicios de autenticación
└── utils.ts                  # Utilidades (cn, etc.)
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start
```

## 🎨 Características Implementadas

### ✅ Sistema de Autenticación
- Página de login con validación
- Página de signup con validación
- Protección de rutas
- Gestión de tokens JWT
- Interceptores de Axios para manejo automático de tokens

### ✅ Sistema de Navegación
- Sidebar responsive con Sheet para móvil
- Navegación entre rutas: `/`, `/auth/login`, `/auth/signup`, `/dashboard`
- Redirecciones automáticas basadas en autenticación
- Resaltado de ruta activa

### ✅ Dashboard
- Layout con sidebar
- Página principal con estadísticas
- Páginas de gestión de keys
- Página de configuración

### ✅ UI/UX
- Diseño responsive
- Componentes de shadcn/ui integrados
- Tema configurado con Tailwind CSS
- Toasts para notificaciones
- Validación de formularios con react-hook-form + zod

## 🔌 Conexión con Backend

El frontend se conecta con el backend FastAPI a través de:

### Endpoints de Autenticación
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/signup` - Registro
- `POST /api/v1/auth/logout` - Cerrar sesión

### Configuración de API
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Interceptor para añadir token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🛡️ Seguridad

- Tokens JWT almacenados en localStorage
- Interceptores de Axios para manejo de errores 401
- Redirección automática al login si el token expira
- Validación de formularios en cliente y servidor
- Protección de rutas con AuthGuard

## 📝 Próximos Pasos

- [ ] Implementar gestión completa de Gateway Keys
- [ ] Implementar gestión de Provider Keys
- [ ] Agregar página de logs/historial
- [ ] Implementar gráficos con Recharts
- [ ] Agregar tests unitarios
- [ ] Implementar paginación en tablas
- [ ] Agregar filtros y búsqueda

## 🚦 Estado Actual

✅ **Entregable 1**: Next.js corriendo en puerto 3000 con layout básico  
✅ **Entregable 2**: Sistema de navegación funcional con sidebar  
✅ **Entregable 3**: Páginas de auth con UX completa y validación

## 🔍 Testing

Para verificar que todo funciona:

1. Inicia el backend: `cd backend && python run.py`
2. Inicia el frontend: `cd frontend-gateway-ia && npm run dev`
3. Accede a `http://localhost:3001`
4. Prueba el registro en `/auth/signup`
5. Prueba el login en `/auth/login`
6. Verifica que redirija al `/dashboard` tras login exitoso

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)
