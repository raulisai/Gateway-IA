# LLM Gateway - Gateway Inteligente para APIs de LLMs

Este proyecto es un enrutador inteligente para APIs de modelos de lenguaje (LLMs) con frontend completo para gestión y analytics.

## 🎯 Características

- ✅ **Gateway API Unificado**: Un solo endpoint para múltiples proveedores (OpenAI, Anthropic, Google, etc.)
- ✅ **Gestión de Keys**: Sistema seguro de Gateway Keys y Provider Keys
- ✅ **Analytics en Tiempo Real**: Dashboard con métricas de costo, latencia, tokens y distribución de modelos
- ✅ **Autenticación JWT**: Sistema completo de auth con auto-logout
- ✅ **Rate Limiting**: Control de límites por Gateway Key
- ✅ **Caché Inteligente**: Sistema de caché para reducir costos
- ✅ **Frontend Moderno**: Next.js 14 con Tailwind CSS y Shadcn/ui

## 📋 Requisitos Previos

- **Docker Desktop** instalado y en ejecución (opcional).
- **Python 3.11+** para el backend.
- **Node.js 18+** para el frontend.

## 🚀 Instalación y Setup

### Opción 1: Con Docker (Recomendado)

#### 1. Preparar el archivo de entorno
```bash
cp .env.example .env
```

Edita `.env` y define:
- `SECRET_KEY`: Cadena aleatoria para tokens JWT
- `MASTER_ENCRYPTION_KEY`: Cadena de 32 caracteres para encriptar API keys

#### 2. Levantar los servicios
```bash
docker-compose up --build
```

Servicios disponibles:
- **Backend (FastAPI)**: `http://localhost:8000`
- **Frontend (Next.js)**: `http://localhost:3000`
- **Updater**: Sincronización de modelos y precios

### Opción 2: Desarrollo Local

#### Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```

Backend disponible en `http://localhost:8000`

#### Frontend
```bash
cd frontend-gateway-ia
npm install
npm run dev
```

Frontend disponible en `http://localhost:3000`

## 🧪 Probar la Integración

### Usando el script de prueba (PowerShell en Windows):
```powershell
.\test-integration.ps1
```

### Usando el script de prueba (Bash en Linux/Mac):
```bash
chmod +x test-integration.sh
./test-integration.sh
```

Este script verificará:
- ✅ Backend y Frontend corriendo
- ✅ Endpoints de analytics funcionando
- ✅ Creación de usuario y autenticación
- ✅ Gestión de Gateway Keys y Provider Keys

## 📖 Flujo de Uso

### 1. Crear una Cuenta
1. Ir a `http://localhost:3000/auth/signup`
2. Registrar un usuario

### 2. Configurar Provider Keys
1. Ir a `http://localhost:3000/dashboard/keys`
2. Agregar keys de proveedores (OpenAI, Anthropic, etc.)

### 3. Crear Gateway Keys
1. En la misma página, crear una Gateway Key
2. Copiar la key generada (solo se muestra una vez)

### 4. Hacer Requests
```bash
curl -X POST http://localhost:8000/api/v1/chat/completions \
  -H "Authorization: Bearer gw_tu_gateway_key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hola"}],
    "model": "gpt-3.5-turbo"
  }'
```

### 5. Ver Analytics
1. Ir a `http://localhost:3000/dashboard`
2. Ver métricas en tiempo real:
   - Costo total
   - Total de requests
   - Tokens procesados
   - Latencia promedio
   - Cache hit rate
   - Gráficos de evolución y distribución

## 🛠️ Estructura del Proyecto

```
Gateway-IA/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # Endpoints
│   │   ├── core/           # Config y seguridad
│   │   ├── crud/           # Operaciones DB
│   │   ├── db/             # Database setup
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
│   └── tests/              # Tests del backend
├── frontend-gateway-ia/    # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── auth/          # Login/Signup
│   │   └── dashboard/     # Dashboard pages
│   ├── components/        # React components
│   │   ├── auth/         # Auth components
│   │   ├── dashboard/    # Dashboard components
│   │   └── ui/           # Shadcn/ui components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   └── lib/              # API client y utils
├── updater/              # Servicio de actualización
├── Documentation/        # Documentación técnica
└── tests/               # Tests de integración
```

## 📚 Documentación

- **[Integración Backend-Frontend](BACKEND-FRONTEND-INTEGRATION.md)**: Guía completa de la integración
- **[Especificación Técnica](Documentation/ESPECIFICACION-TECNICA-DEVELOPER.md)**: Detalles técnicos del proyecto
- **[Roadmap](Documentation/ROADMAP-50-CHECKPOINTS.md)**: Plan de desarrollo con 50 checkpoints
- **[Resumen Integral](Documentation/RESUMEN-INTEGRAL.md)**: Visión general del proyecto
- **[API Docs](http://localhost:8000/docs)**: Documentación interactiva de la API (cuando el backend está corriendo)

## 🔧 Tecnologías

### Backend
- FastAPI 0.109.0
- SQLAlchemy 2.0.35
- Pydantic 2.10.0
- Python-JOSE (JWT)
- Bcrypt & Passlib
- Tiktoken 0.8.0

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- React Query (@tanstack/react-query)
- Recharts 2.10.3
- Axios

## 🐛 Troubleshooting

### El backend no inicia
```bash
cd backend
pip install --upgrade -r requirements.txt
python run.py
```

### El frontend no muestra datos
1. Verificar que el backend esté corriendo
2. Abrir DevTools > Network y revisar requests
3. Verificar que estés autenticado (token en localStorage)

### No se pueden crear keys
1. Verificar que el usuario esté autenticado
2. Revisar consola del navegador por errores
3. Verificar que el backend no devuelva errores 422

## ✅ Checkpoints Completados

- ✅ **Checkpoint 1-33:** Backend completo con todos los endpoints
- ✅ **Checkpoint 34:** API Client con todos los endpoints
- ✅ **Checkpoint 35:** Auth Context con JWT y auto-logout
- ✅ **Checkpoint 36:** Dashboard Principal con métricas en tiempo real
- ✅ **Checkpoint 37:** Analytics Charts (Cost + Distribution)
- ✅ **Checkpoint 38:** Keys Management con CRUD completo
- ✅ **Extra:** Sincronización completa de tipos backend-frontend
- ✅ **Extra:** Toast notifications y estados de loading

## 🎯 Próximos Pasos

1. Implementar tests E2E
2. Agregar más gráficos de analytics
3. Implementar filtros de fecha
4. Agregar exportación de datos (CSV, JSON)
5. Notificaciones en tiempo real con WebSockets
6. Página de Settings con configuración de usuario
7. Límites de presupuesto y alertas

## 📄 Licencia

Este proyecto es parte del desarrollo interno. Para uso comercial, contactar al equipo.

---

**Estado del Proyecto:** ✅ Completamente Funcional  
**Última Actualización:** 2024-01-20
