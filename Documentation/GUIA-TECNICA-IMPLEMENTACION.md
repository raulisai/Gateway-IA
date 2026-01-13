---
title: Guía Técnica de Implementación
type: documentacion_tecnica
created: '2026-01-11'
tags:
  - documentacion
  - tecnica
  - guia
  - prompts
---
# 📘 LLM Gateway - Guía Técnica de Implementación

> **Documento estilo Prompt**: Consideraciones técnicas, decisiones de diseño y mejores prácticas para implementar cada componente del sistema

---

## 🎯 Propósito del Documento

Esta guía proporciona el "qué" y el "cómo" conceptual para implementar el LLM Gateway, sin incluir código específico. Está diseñada como un conjunto de prompts técnicos que describen las consideraciones clave para cada componente.

---

## 🏗️ PARTE 1: ARQUITECTURA GENERAL

### 1.1 Decisiones de Diseño del Sistema

#### Arquitectura de Microservicios con Docker Compose

**¿Qué se necesita considerar?**
- El sistema se divide en 3 contenedores independientes: frontend, backend, updater
- Cada contenedor tiene su propio Dockerfile con dependencias específicas
- Los contenedores se comunican a través de una red bridge de Docker
- El volumen compartido `./data` permite persistencia de SQLite y models.json
- Los puertos 3000 (frontend) y 8000 (backend) se exponen al host

**¿Por qué esta arquitectura?**
- **Separación de responsabilidades**: Cada servicio tiene un propósito único
- **Escalabilidad independiente**: Se pueden escalar servicios por separado
- **Desarrollo paralelo**: Frontend y backend se desarrollan independientemente
- **Facilidad de deployment**: Docker Compose simplifica el despliegue

**Consideraciones importantes:**
- El updater debe ser un servicio "fire-and-forget" que no bloquea el backend
- La red bridge debe permitir comunicación entre backend y frontend por nombre de servicio
- Los volúmenes deben tener permisos correctos para lectura/escritura
- Las variables de entorno sensibles deben manejarse con archivos .env

---

### 1.2 Flujo de Datos Principal

#### Pipeline de Procesamiento de Requests

**Flujo completo que debe implementarse:**

```
Request → Authentication → Cache Check → [Cache Hit] → Return Cached
                                      ↓ [Cache Miss]
                              Classification → Routing → Provider Call → Response
                                                                          ↓
                                                                  Cache + Log → Return
```

**Consideraciones para cada etapa:**

1. **Authentication**
   - Validar que el gateway key exista y esté activo
   - Verificar que no haya expirado
   - Cargar datos del usuario para tracking
   - Rechazar requests inválidos inmediatamente (fail-fast)

2. **Cache Check**
   - Generar hash único del request (messages + parámetros relevantes)
   - Buscar en cache en memoria (debe ser O(1))
   - Verificar que TTL no haya expirado
   - Si hay hit, registrar métrica pero NO loguear como request completo

3. **Classification**
   - Contar tokens del prompt usando tiktoken
   - Analizar características: longitud, complejidad léxica, dominio
   - Asignar nivel: simple (<500 tokens), moderate (500-2000), complex (2000-8000), expert (>8000)
   - La clasificación debe ser rápida (<50ms)

4. **Routing**
   - Filtrar modelos disponibles por: context window, health status, rate limits
   - Calcular score para cada modelo: `score = (quality_weight/cost) + speed_bonus`
   - Seleccionar modelo con mayor score
   - Tener estrategia de fallback si modelo primario falla

5. **Provider Call**
   - Desencriptar API key del usuario para el provider seleccionado
   - Construir request en formato específico del provider
   - Hacer llamada HTTP con timeout (30s default)
   - Manejar retry con exponential backoff: 1s, 2s, 4s, 8s
   - Normalizar respuesta a formato estándar

6. **Cache + Log**
   - Guardar respuesta en cache con TTL de 1 hora
   - Insertar registro en DB: tokens, costo, latencia, modelo usado
   - Actualizar métricas agregadas en memoria
   - No bloquear la respuesta al usuario

---

## 🔒 PARTE 2: SEGURIDAD Y AUTENTICACIÓN

### 2.1 Sistema de Encriptación de API Keys

#### ¿Qué se debe implementar?

**Problema a resolver:**
Los usuarios proporcionan API keys de terceros (OpenAI, Anthropic) que deben almacenarse de forma segura en la base de datos. Si alguien obtiene acceso a la DB, no debe poder leer las keys en texto plano.

**Solución: Encriptación simétrica con Fernet**

**Componentes necesarios:**

1. **Master Password**
   - Variable de entorno `MASTER_ENCRYPTION_KEY` (mínimo 32 caracteres)
   - NO debe estar en código ni en Git
   - Debe ser única por instalación
   - Si se pierde, las keys encriptadas son irrecuperables

2. **Derivación de Key**
   - Usar PBKDF2 para derivar key criptográfica desde master password
   - Agregar salt único por instalación (almacenado en DB o config)
   - Iteraciones: 100,000+ para resistencia a brute force

3. **Proceso de Encriptación**
   ```
   API Key (plaintext) → Fernet.encrypt() → Encrypted Key (bytes) → Base64 → Store in DB
   ```

4. **Proceso de Desencriptación**
   ```
   DB → Base64 → Encrypted Key (bytes) → Fernet.decrypt() → API Key (plaintext) → Use
   ```

**Consideraciones críticas:**
- La desencriptación solo debe ocurrir en memoria, justo antes de usar la key
- NUNCA loguear o retornar keys desencriptadas en responses
- Implementar rate limiting en endpoints que usan keys para prevenir abuse
- Considerar key rotation: permitir re-encriptar con nueva master key

---

### 2.2 Autenticación JWT

#### ¿Cómo debe funcionar?

**Sistema de tokens para autenticar usuarios del dashboard**

**Componentes:**

1. **Registro (Signup)**
   - Recibir email + password
   - Validar formato de email (regex)
   - Validar fortaleza de password (min 8 chars, mayúscula, número)
   - Hash password con bcrypt (cost factor 12)
   - Crear usuario en DB
   - Auto-generar primer gateway key para el usuario
   - Retornar JWT token

2. **Login**
   - Recibir email + password
   - Buscar usuario por email
   - Comparar password con bcrypt.verify()
   - Si válido, generar JWT token
   - Token contiene: user_id, email, exp (24h), iat

3. **JWT Token Structure**
   ```json
   {
     "user_id": "uuid",
     "email": "user@example.com",
     "iat": 1234567890,
     "exp": 1234654290
   }
   ```

4. **Validación de Token**
   - Middleware intercepta requests con header `Authorization: Bearer <token>`
   - Verificar firma del token con SECRET_KEY
   - Verificar que no haya expirado
   - Extraer user_id y adjuntar al request para uso posterior
   - Rechazar con 401 si inválido o expirado

**Consideraciones:**
- SECRET_KEY debe ser fuerte (32+ caracteres aleatorios)
- Implementar refresh tokens si se requiere sesión persistente
- Considerar invalidación de tokens (logout) con blacklist en Redis/cache
- NO almacenar información sensible en el token (es decodificable)

---

## 🧠 PARTE 3: LÓGICA DE NEGOCIO CORE

### 3.1 Request Classifier

#### ¿Cómo clasificar requests automáticamente?

**Objetivo:** Analizar el request del usuario y determinar qué tan "complejo" es para elegir el modelo apropiado.

**Factores a considerar:**

1. **Token Count (peso: 60%)**
   - Usar tiktoken para contar tokens del prompt
   - Rangos sugeridos:
     - Simple: 0-500 tokens
     - Moderate: 501-2000 tokens  
     - Complex: 2001-8000 tokens
     - Expert: 8000+ tokens

2. **Complejidad Léxica (peso: 20%)**
   - Presencia de términos técnicos (código, math, ciencia)
   - Longitud promedio de palabras
   - Uso de jerga especializada
   - Detección de código (markdown, snippets)

3. **Tipo de Tarea (peso: 20%)**
   - QA simple: "¿Cuál es la capital de Francia?"
   - Análisis: "Compara estos dos documentos"
   - Generación creativa: "Escribe un cuento"
   - Razonamiento complejo: "Resuelve este problema matemático"
   - Coding: "Implementa esta función"

**Implementación sugerida:**

```
def classify_request(messages, parameters):
    1. Contar tokens totales
    2. Extraer features del texto (keywords, código, preguntas)
    3. Calcular score ponderado
    4. Mapear score a nivel de complejidad
    5. Retornar: {
         "complexity": "moderate",
         "estimated_tokens": 1500,
         "features": ["code", "analysis"]
       }
```

**Consideraciones:**
- Debe ser rápido (<50ms) para no agregar latencia
- Puede empezar simple (solo token count) y evolucionar
- En futuro, usar modelo ML ligero para clasificación más precisa
- Cachear clasificaciones de prompts similares

---

### 3.2 Routing Engine

#### ¿Cómo seleccionar el mejor modelo?

**Problema:** Dados múltiples modelos disponibles, elegir el óptimo basándose en complejidad, costo, velocidad y disponibilidad.

**Pipeline de decisión:**

1. **Cargar Modelos Disponibles**
   - Leer models.json del registry
   - Filtrar solo modelos para los cuales el usuario tiene API keys configuradas

2. **Filtrado por Requisitos**
   
   **Filtro 1: Context Window**
   - Calcular tokens necesarios: prompt + completion esperada + buffer (20%)
   - Eliminar modelos con context window insuficiente
   
   **Filtro 2: Provider Health**
   - Verificar si provider tuvo errores recientes (últimos 5 min)
   - Eliminar providers con tasa de error >50%
   
   **Filtro 3: Rate Limits**
   - Verificar requests por minuto del usuario con ese provider
   - Eliminar si se excedió límite

3. **Scoring de Modelos Restantes**

   **Formula sugerida:**
   ```
   score = (quality_multiplier / cost_per_1m_tokens) + speed_bonus
   
   donde:
   quality_multiplier = {
     simple: 1.0,
     moderate: 1.5,
     complex: 2.0,
     expert: 3.0
   }
   
   speed_bonus = {
     si latencia_promedio < 2s: +10
     si latencia_promedio < 5s: +5
     sino: 0
   }
   ```

4. **Selección Final**
   - Ordenar modelos por score descendente
   - Retornar el top 1
   - Guardar top 3 como fallbacks en caso de falla

**Consideraciones:**
- El scoring debe reflejar las prioridades del negocio (costo vs calidad)
- Implementar estrategia de fallback automático: si modelo A falla, probar B
- Registrar métricas de cuántas veces se usa cada modelo
- Permitir override manual: usuario puede forzar un modelo específico

---

### 3.3 Provider Manager

#### ¿Cómo interactuar con múltiples APIs LLM?

**Desafío:** Cada proveedor (OpenAI, Anthropic, Google) tiene formato diferente de request/response.

**Patrón de diseño: Adapter Pattern**

**Estructura necesaria:**

1. **BaseProvider (clase abstracta)**
   - Métodos abstractos: `call()`, `validate_key()`, `format_request()`, `parse_response()`
   - Métodos concretos: retry logic, error handling, timeout

2. **OpenAIProvider**
   - Endpoint: `https://api.openai.com/v1/chat/completions`
   - Headers: `Authorization: Bearer sk-...`
   - Body format: `{"model": "gpt-4", "messages": [...], "temperature": 0.7}`
   - Response format: `{choices: [{message: {content: "..."}}], usage: {...}}`

3. **AnthropicProvider**
   - Endpoint: `https://api.anthropic.com/v1/messages`
   - Headers: `x-api-key: sk-ant-...`, `anthropic-version: 2023-06-01`
   - Body format: `{"model": "claude-3", "messages": [...], "max_tokens": 1024}`
   - Response format: `{content: [{text: "..."}], usage: {...}}`

4. **GoogleProvider**
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
   - Headers: `x-goog-api-key: ...`
   - Body format: `{"contents": [{"parts": [{"text": "..."}]}]}`

**Proceso unificado:**

```
1. ProviderManager.call(provider_name, model, messages, params)
2. Seleccionar adapter correcto (OpenAI/Anthropic/Google)
3. Obtener y desencriptar API key del usuario
4. Formatear request al formato del provider
5. Hacer HTTP POST con timeout y retry
6. Parsear response al formato unificado
7. Retornar: {
     "content": "response text",
     "model": "gpt-4",
     "usage": {"prompt_tokens": 10, "completion_tokens": 50},
     "provider": "openai"
   }
```

**Manejo de errores:**

- **401 Unauthorized**: API key inválida → marcar key como inválida en DB, notificar usuario
- **429 Rate Limit**: Demasiados requests → esperar (retry-after header) o fallback a otro provider
- **500 Server Error**: Error temporal del provider → retry con backoff exponencial
- **Timeout**: Sin respuesta en 30s → cancelar y probar fallback

**Consideraciones:**
- Cada adapter debe normalizar errores a un formato común
- Implementar circuit breaker: si un provider falla 5 veces seguidas, no intentar por 5 minutos
- Loguear todas las llamadas para debugging
- Implementar streaming si el provider lo soporta (OpenAI, Anthropic)

---

## 💾 PARTE 4: PERSISTENCIA Y CACHE

### 4.1 Diseño de Base de Datos

#### Schema de SQLite

**Tablas principales:**

**1. users**
```sql
- id: UUID PRIMARY KEY
- email: VARCHAR UNIQUE NOT NULL
- password_hash: VARCHAR NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- plan: VARCHAR DEFAULT 'free' (free/pro/enterprise)
- is_active: BOOLEAN DEFAULT true
```

**2. gateway_keys**
```sql
- id: UUID PRIMARY KEY
- user_id: UUID FOREIGN KEY → users.id
- key_hash: VARCHAR NOT NULL (hash del key, no plaintext)
- prefix: VARCHAR (ej: "gw_abc123", primeros 10 chars)
- name: VARCHAR (nombre descriptivo dado por usuario)
- created_at: TIMESTAMP
- last_used_at: TIMESTAMP
- is_active: BOOLEAN DEFAULT true
- rate_limit: INTEGER DEFAULT 100 (requests por minuto)
```

**3. provider_keys**
```sql
- id: UUID PRIMARY KEY
- user_id: UUID FOREIGN KEY → users.id
- provider: VARCHAR (openai/anthropic/google)
- encrypted_key: TEXT NOT NULL
- last_verified_at: TIMESTAMP (última vez que se verificó que funciona)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
```

**4. request_logs**
```sql
- id: UUID PRIMARY KEY
- user_id: UUID FOREIGN KEY → users.id
- gateway_key_id: UUID FOREIGN KEY → gateway_keys.id
- endpoint: VARCHAR (/v1/chat/completions)
- complexity: VARCHAR (simple/moderate/complex/expert)
- provider: VARCHAR
- model: VARCHAR
- prompt_tokens: INTEGER
- completion_tokens: INTEGER
- total_tokens: INTEGER
- cost_usd: DECIMAL(10, 6)
- latency_ms: INTEGER
- cache_hit: BOOLEAN
- status_code: INTEGER
- error_message: TEXT (si hubo error)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Índices necesarios:**
```sql
CREATE INDEX idx_request_logs_user_created ON request_logs(user_id, created_at DESC);
CREATE INDEX idx_request_logs_model ON request_logs(model);
CREATE INDEX idx_gateway_keys_user ON gateway_keys(user_id);
CREATE INDEX idx_provider_keys_user_provider ON provider_keys(user_id, provider);
```

**Consideraciones:**
- Usar UUIDs para evitar enumeration attacks
- Implementar soft deletes (is_active flag) en lugar de DELETE
- Particionar request_logs por mes si crece mucho (>10M registros)
- Backup diario de gateway.db

---

### 4.2 Cache Manager

#### Sistema de caché LRU en memoria

**¿Por qué caché?**
- Requests idénticos pueden reutilizar respuestas previas
- Ahorra dinero (no llamar a providers)
- Reduce latencia (cache hit es <10ms vs 2s de API call)

**Implementación:**

1. **Cache Key Generation**
   ```
   cache_key = hash(
     messages (ordenados canónicamente),
     model (si usuario especifica),
     temperature,
     max_tokens
   )
   ```
   - Usar SHA256 para generar hash determinístico
   - Normalizar inputs para consistencia (ej: strip whitespace)

2. **Cache Structure**
   ```python
   cache = {
     "hash123": {
       "response": {...},
       "timestamp": 1234567890,
       "ttl": 3600,
       "hit_count": 5
     }
   }
   ```

3. **LRU Eviction**
   - Usar OrderedDict o librería cachetools
   - Tamaño máximo: 1000 entries
   - Cuando se llena, eliminar el menos recientemente usado
   - Mover entries al final cuando se acceden (marcar como "usado recientemente")

4. **TTL (Time To Live)**
   - Default: 1 hora
   - Verificar en cada lookup si ha expirado
   - Si expiró, eliminar y tratar como cache miss

**Proceso completo:**

```
1. Request llega
2. Generar cache_key
3. Buscar en cache
4. Si existe y TTL válido:
   - Incrementar hit_count
   - Mover al final del LRU
   - Retornar respuesta inmediatamente
5. Si no existe (cache miss):
   - Procesar request normalmente
   - Al obtener respuesta, guardar en cache
   - Si cache lleno, evict LRU entry
```

**Consideraciones:**
- Cache debe ser thread-safe si backend usa workers concurrentes
- Implementar métricas: cache hit rate = hits / (hits + misses)
- Permitir invalidar cache manualmente (clear all, clear by pattern)
- Cache no debe almacenar respuestas con errores
- Para producción, considerar Redis para cache distribuido

---

## 📊 PARTE 5: ANALYTICS Y MONITORING

### 5.1 Sistema de Tracking de Costos

#### ¿Cómo calcular costos preciso?

**Desafío:** Cada modelo tiene precio diferente para input tokens vs output tokens.

**Datos necesarios en models.json:**
```json
{
  "id": "gpt-4o",
  "pricing": {
    "prompt": 2.50,        // USD per 1M tokens
    "completion": 10.00    // USD per 1M tokens
  }
}
```

**Fórmula de cálculo:**
```
cost_usd = (
  (prompt_tokens / 1_000_000) * pricing.prompt +
  (completion_tokens / 1_000_000) * pricing.completion
)
```

**Proceso de logging:**

1. **Después de cada request exitoso:**
   ```python
   log_entry = {
     user_id: ...,
     model: "gpt-4o",
     prompt_tokens: 150,
     completion_tokens: 500,
     cost_usd: calculate_cost(model, tokens),
     latency_ms: 2340,
     cache_hit: false,
     timestamp: now()
   }
   db.request_logs.insert(log_entry)
   ```

2. **Actualizar agregados en memoria:**
   ```python
   user_metrics[user_id]["daily_cost"] += cost_usd
   user_metrics[user_id]["daily_requests"] += 1
   model_usage[model] += 1
   ```

3. **Persistir agregados periódicamente:**
   - Cada hora: guardar snapshot en DB
   - Permite queries rápidas sin recalcular todo

**Consideraciones:**
- Redondear costos a 6 decimales para precisión
- Verificar precios actualizados desde model registry
- Alertar usuario si supera presupuesto diario/mensual
- Exportar logs a CSV/JSON para facturación

---

### 5.2 Analytics Endpoints

#### ¿Qué métricas exponer en el dashboard?

**Endpoint 1: Overview (/api/analytics/overview)**

**Query de ejemplo:**
```sql
SELECT 
  COUNT(*) as total_requests,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as cache_rate
FROM request_logs
WHERE user_id = ? AND created_at > NOW() - INTERVAL '24 hours'
```

**Response:**
```json
{
  "total_requests": 1523,
  "total_cost": 4.52,
  "avg_latency_ms": 2100,
  "cache_hit_rate": 23.5,
  "period": "24h"
}
```

**Endpoint 2: Cost Breakdown (/api/analytics/cost-breakdown?days=7)**

**Query de ejemplo:**
```sql
SELECT 
  DATE(created_at) as date,
  SUM(cost_usd) as cost,
  COUNT(*) as requests
FROM request_logs
WHERE user_id = ? AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

**Response:**
```json
{
  "data": [
    {"date": "2026-01-05", "cost": 0.85, "requests": 320},
    {"date": "2026-01-06", "cost": 1.20, "requests": 450},
    ...
  ]
}
```

**Endpoint 3: Model Distribution (/api/analytics/model-distribution)**

**Query de ejemplo:**
```sql
SELECT 
  model,
  COUNT(*) as count,
  SUM(cost_usd) as total_cost
FROM request_logs
WHERE user_id = ? AND created_at > NOW() - INTERVAL '30 days'
GROUP BY model
ORDER BY count DESC
```

**Response:**
```json
{
  "models": [
    {"model": "gpt-4o-mini", "requests": 850, "cost": 2.10, "percentage": 55.8},
    {"model": "claude-3-haiku", "requests": 430, "cost": 0.80, "percentage": 28.2},
    {"model": "gpt-4o", "requests": 243, "cost": 6.50, "percentage": 15.9}
  ]
}
```

**Consideraciones:**
- Implementar paginación para grandes datasets
- Cachear resultados de analytics por 1 minuto
- Permitir filtros: por modelo, por rango de fechas, por complejidad
- Optimizar queries con índices apropiados

---

## 🔄 PARTE 6: UPDATER SERVICE

### 6.1 Model Registry Auto-Update

#### ¿Cómo mantener el catálogo actualizado?

**Problema:** Los precios de modelos LLM cambian frecuentemente. El sistema debe actualizarse sin intervención manual.

**Solución: Servicio background que sincroniza desde fuente central**

**Flujo completo:**

1. **Source of Truth**
   - GitHub repo público con registry.json
   - Actualizado por scraper/bot que monitorea páginas de pricing
   - Versión centralizada que todos los gateways consultan

2. **Scheduler en Updater Service**
   ```python
   schedule.every().day.at("00:00").do(update_registry)
   ```
   - Ejecutar una vez al día
   - Horario de baja actividad (medianoche UTC)

3. **Proceso de actualización:**

   a. **Fetch from GitHub**
   ```
   URL: https://raw.githubusercontent.com/user/repo/main/registry.json
   Method: HTTP GET
   Timeout: 10s
   ```

   b. **Validate Structure**
   ```python
   def validate_registry(data):
     required_fields = ["version", "updated_at", "models"]
     for model in data["models"]:
       assert "id" in model
       assert "pricing" in model
       assert "specs" in model
   ```

   c. **Compare Versions**
   ```python
   current_version = load_local_registry()["version"]
   new_version = fetched_data["version"]
   
   if new_version <= current_version:
     return  # No update needed
   ```

   d. **Backup Current**
   ```bash
   cp data/models.json data/models.json.bak
   ```

   e. **Write New Version**
   ```python
   with open("data/models.json", "w") as f:
     json.dump(fetched_data, f, indent=2)
   ```

   f. **Trigger Backend Reload**
   - Backend detecta cambio en archivo (watchdog o polling)
   - Recarga ModelRegistry sin reiniciar servidor
   - Log de cambios detectados

4. **Detección de Cambios Importantes**

   **Price Changes:**
   ```python
   for model in new_models:
     old_price = old_registry[model.id].pricing
     new_price = model.pricing
     if new_price != old_price:
       alert(f"Price changed for {model.id}: {old_price} → {new_price}")
   ```

   **New Models:**
   ```python
   new_model_ids = set(m.id for m in new_models)
   old_model_ids = set(m.id for m in old_models)
   added = new_model_ids - old_model_ids
   if added:
     alert(f"New models available: {added}")
   ```

   **Deprecated Models:**
   ```python
   deprecated = old_model_ids - new_model_ids
   if deprecated:
     alert(f"Models removed: {deprecated}")
   ```

5. **Notificaciones**
   - Log en archivo: `/var/log/updater.log`
   - Email a admin (opcional)
   - Webhook a Slack/Discord (opcional)
   - Mostrar banner en dashboard si hay cambios críticos

**Consideraciones:**
- Manejar errores de red: si fetch falla, mantener registry actual
- Validar integridad: checksum o firma digital del registry
- Permitar rollback manual: `docker exec updater python rollback.py`
- Implementar feature flags: permitir desactivar modelos sin eliminarlos
- Versionado semántico: major.minor.patch para registry

---

## 🎨 PARTE 7: FRONTEND DASHBOARD

### 7.1 Arquitectura de Frontend

#### Stack Next.js + React Query

**Decisiones de diseño:**

1. **Next.js App Router (no Pages Router)**
   - Usar Server Components donde sea posible
   - Client Components solo cuando se necesita interactividad
   - Layouts compartidos para evitar re-renders

2. **React Query para Data Fetching**
   ```javascript
   const { data, isLoading, error } = useQuery({
     queryKey: ['analytics', 'overview'],
     queryFn: () => api.getAnalyticsOverview(),
     refetchInterval: 30000  // Re-fetch cada 30s
   })
   ```
   - Caché automático de queries
   - Optimistic updates para mutaciones
   - Retry automático en errores

3. **Shadcn/ui para Componentes**
   - Componentes pre-hechos y customizables
   - Integrados con Tailwind CSS
   - Accesibles (a11y) por defecto

**Estructura de rutas:**
```
app/
├── page.tsx                    # Landing page
├── auth/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── dashboard/
│   ├── layout.tsx              # Layout con sidebar
│   ├── page.tsx                # Overview dashboard
│   ├── keys/page.tsx           # Gateway keys
│   ├── models/page.tsx         # Model catalog
│   └── analytics/page.tsx      # Analytics detallados
```

---

### 7.2 Sistema de Autenticación Frontend

#### ¿Cómo manejar auth en el cliente?

**Flujo de login:**

1. **Usuario submite formulario**
   ```javascript
   const handleLogin = async (email, password) => {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       body: JSON.stringify({ email, password })
     })
     const { token, user } = await response.json()
     
     // Guardar token en localStorage
     localStorage.setItem('token', token)
     
     // Redirigir a dashboard
     router.push('/dashboard')
   }
   ```

2. **Interceptor para agregar token**
   ```javascript
   // lib/api.ts
   const api = axios.create({
     baseURL: 'http://localhost:8000'
   })
   
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('token')
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })
   ```

3. **Middleware de protección de rutas**
   ```javascript
   // middleware.ts
   export function middleware(request) {
     const token = request.cookies.get('token')
     
     if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/auth/login', request.url))
     }
   }
   ```

4. **Hook de autenticación**
   ```javascript
   function useAuth() {
     const [user, setUser] = useState(null)
     
     useEffect(() => {
       const token = localStorage.getItem('token')
       if (token) {
         // Verificar token con backend
         api.get('/api/auth/me').then(response => {
           setUser(response.data)
         })
       }
     }, [])
     
     const logout = () => {
       localStorage.removeItem('token')
       setUser(null)
       router.push('/auth/login')
     }
     
     return { user, logout }
   }
   ```

**Consideraciones:**
- Renovar token automáticamente antes de expiración (refresh tokens)
- Limpiar localStorage en logout
- Manejar expiración de token: si backend retorna 401, redirigir a login
- No almacenar información sensible en localStorage (solo token)

---

### 7.3 Dashboard de Analytics

#### ¿Cómo visualizar métricas?

**Componentes principales:**

1. **MetricsCard** (4 cards en la parte superior)
   ```jsx
   <div className="grid grid-cols-4 gap-4">
     <MetricsCard 
       title="Total Cost"
       value="$4.52"
       change="+12%"
       trend="up"
     />
     <MetricsCard 
       title="Requests"
       value="1,523"
       change="+8%"
       trend="up"
     />
     <MetricsCard 
       title="Avg Latency"
       value="2.1s"
       change="-5%"
       trend="down"
     />
     <MetricsCard 
       title="Cache Rate"
       value="23.5%"
       change="+3%"
       trend="up"
     />
   </div>
   ```

2. **CostChart** (gráfico de línea de últimos 7 días)
   ```jsx
   <LineChart data={costData}>
     <XAxis dataKey="date" />
     <YAxis />
     <Line dataKey="cost" stroke="#3b82f6" />
     <Tooltip />
   </LineChart>
   ```

3. **ModelDistributionChart** (pie chart de modelos usados)
   ```jsx
   <PieChart>
     <Pie 
       data={modelData}
       dataKey="requests"
       nameKey="model"
     />
     <Tooltip />
     <Legend />
   </PieChart>
   ```

4. **RecentRequestsTable** (tabla de últimos 10 requests)
   ```jsx
   <Table>
     <TableHeader>
       <TableRow>
         <TableHead>Timestamp</TableHead>
         <TableHead>Model</TableHead>
         <TableHead>Tokens</TableHead>
         <TableHead>Cost</TableHead>
         <TableHead>Latency</TableHead>
       </TableRow>
     </TableHeader>
     <TableBody>
       {requests.map(req => (
         <TableRow key={req.id}>
           <TableCell>{formatTime(req.created_at)}</TableCell>
           <TableCell>{req.model}</TableCell>
           <TableCell>{req.total_tokens}</TableCell>
           <TableCell>${req.cost_usd}</TableCell>
           <TableCell>{req.latency_ms}ms</TableCell>
         </TableRow>
       ))}
     </TableBody>
   </Table>
   ```

**Consideraciones:**
- Implementar loading skeletons mientras cargan datos
- Manejar estados de error con mensajes claros
- Actualizar datos en tiempo real (polling cada 30s o WebSocket)
- Responsive design: en mobile, cards se apilan verticalmente

---

## 🧪 PARTE 8: TESTING Y CALIDAD

### 8.1 Estrategia de Testing

#### ¿Qué testear y cómo?

**Niveles de testing:**

1. **Unit Tests** (componentes individuales)
   - Request Classifier: verificar que clasifica correctamente
   - Routing Engine: verificar scoring y selección
   - KeyVault: verificar encriptación/desencriptación
   - Cache Manager: verificar LRU eviction y TTL

2. **Integration Tests** (flujos completos)
   - Login → Dashboard → Ver métricas
   - Agregar provider key → Hacer request → Ver en logs
   - Request con cache miss → cache hit en segundo request

3. **End-to-End Tests** (desde UI)
   - Usuario se registra → agrega OpenAI key → hace test request → ve costo

**Herramientas:**

- **Backend**: pytest
  ```python
  def test_classifier_simple_request():
    messages = [{"role": "user", "content": "Hello"}]
    result = classifier.classify(messages)
    assert result["complexity"] == "simple"
    assert result["estimated_tokens"] < 500
  ```

- **Frontend**: Vitest + React Testing Library
  ```javascript
  test('MetricsCard displays correct value', () => {
    render(<MetricsCard title="Cost" value="$4.52" />)
    expect(screen.getByText('$4.52')).toBeInTheDocument()
  })
  ```

- **E2E**: Playwright
  ```javascript
  test('complete user flow', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
  ```

**Consideraciones:**
- Target: 80%+ code coverage en backend core services
- Mockear llamadas externas (providers) en tests
- Usar fixtures para datos de prueba consistentes
- CI/CD: ejecutar tests en cada push a main

---

## 🚀 PARTE 9: DEPLOYMENT Y PRODUCCIÓN

### 9.1 Preparación para Producción

#### ¿Qué cambios hacer para prod?

**Diferencias Dev vs Prod:**

| Aspecto | Development | Production |
|---------|-------------|------------|
| **Debug** | ON | OFF |
| **Frontend Port** | 3000 (expuesto) | Interno o detrás de proxy |
| **Backend Port** | 8000 (expuesto) | Expuesto con HTTPS |
| **Database** | SQLite en volume local | SQLite con backups automáticos |
| **Logs** | Console output | Archivo + sistema de logs (ELK/Loki) |
| **Secrets** | .env local | Variables de entorno inyectadas |
| **Updates** | Manual | Automáticos con GitHub Actions |

**Checklist de producción:**

1. **Seguridad**
   - [ ] Cambiar SECRET_KEY y MASTER_ENCRYPTION_KEY
   - [ ] Habilitar HTTPS con certificado SSL (Let's Encrypt)
   - [ ] Configurar CORS restringido (no `*`)
   - [ ] Implementar rate limiting estricto
   - [ ] Habilitar helmet/security headers

2. **Performance**
   - [ ] Habilitar compresión gzip
   - [ ] Configurar CDN para frontend estático
   - [ ] Optimizar imágenes y assets
   - [ ] Implementar caching de responses

3. **Monitoring**
   - [ ] Configurar health checks (Docker)
   - [ ] Implementar logging estructurado
   - [ ] Configurar alertas (email/Slack) para errores
   - [ ] Exponer métricas de Prometheus

4. **Backups**
   - [ ] Backup diario de gateway.db
   - [ ] Versionado de models.json
   - [ ] Snapshot de volúmenes Docker

5. **CI/CD**
   - [ ] GitHub Actions para tests automáticos
   - [ ] Build automático de Docker images
   - [ ] Deploy automático en merge a main

**docker-compose.prod.yml:**
```yaml
services:
  frontend:
    image: ghcr.io/user/gateway-frontend:latest
    restart: always
    environment:
      - NODE_ENV=production
    # Puerto interno, no expuesto públicamente
    
  backend:
    image: ghcr.io/user/gateway-backend:latest
    restart: always
    ports:
      - "443:8000"  # HTTPS
    environment:
      - DEBUG=false
      - SECRET_KEY=${SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📝 PARTE 10: DOCUMENTACIÓN Y MANTENIMIENTO

### 10.1 Documentación para Usuarios

#### ¿Qué documentar para los usuarios del gateway?

**1. README.md completo**
   - Descripción del proyecto
   - Features principales
   - Quick start guide
   - Requisitos del sistema
   - Instrucciones de instalación

**2. API Documentation (OpenAPI/Swagger)**
   ```yaml
   openapi: 3.0.0
   paths:
     /v1/chat/completions:
       post:
         summary: Main gateway endpoint
         requestBody:
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   messages:
                     type: array
                   temperature:
                     type: number
         responses:
           200:
             description: Success
   ```

**3. User Guide**
   - Cómo registrarse
   - Cómo agregar API keys de proveedores
   - Cómo usar el gateway en tu app
   - Ejemplos de código (cURL, Python, JavaScript)
   - Interpretación de métricas

**4. FAQ**
   - ¿Cómo se calcula el costo?
   - ¿Qué modelos están disponibles?
   - ¿Cómo funciona el cache?
   - ¿Qué pasa si mi API key expira?

**Consideraciones:**
- Mantener docs sincronizadas con código
- Incluir ejemplos prácticos en todos los endpoints
- Versionar docs junto con el software

---

## ✅ Checklist Final de Implementación

### Antes de considerar el proyecto "completo":

**Backend:**
- [ ] Todos los endpoints implementados y documentados
- [ ] Tests unitarios >80% coverage
- [ ] Manejo de errores robusto
- [ ] Logging completo
- [ ] Rate limiting funcional
- [ ] Encriptación de keys verificada

**Frontend:**
- [ ] Todas las páginas responsive
- [ ] Loading states y error handling
- [ ] Formularios validados
- [ ] Charts funcionando correctamente
- [ ] Tema consistente (light/dark mode opcional)

**Infrastructure:**
- [ ] Docker Compose funcional
- [ ] Volúmenes persistentes configurados
- [ ] Secrets manejados correctamente
- [ ] Health checks implementados

**Documentation:**
- [ ] README completo
- [ ] API docs generadas
- [ ] Guía de instalación
- [ ] Ejemplos de uso
- [ ] Troubleshooting guide

**Security:**
- [ ] Passwords hasheados
- [ ] API keys encriptadas
- [ ] JWT tokens seguros
- [ ] CORS configurado
- [ ] Input validation en todos los endpoints

**Testing:**
- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] E2E tests críticos cubiertos
- [ ] Load testing básico realizado

---

## 🎓 Conceptos Clave a Dominar

### Para implementar exitosamente este proyecto, debes entender:

1. **Backend Development**
   - REST API design
   - Database modeling (SQL)
   - Authentication & authorization (JWT)
   - Cryptography basics (Fernet, bcrypt)
   - Async programming (si usas async/await)

2. **Frontend Development**
   - React hooks y componentes
   - State management (Context/Zustand)
   - Data fetching (React Query)
   - Responsive design (Tailwind CSS)
   - Forms y validación

3. **DevOps**
   - Docker containers
   - Docker Compose orchestration
   - Volumes y networks
   - Environment variables
   - Basic security practices

4. **System Design**
   - Microservices architecture
   - Caching strategies
   - Load balancing concepts
   - Error handling & retry logic
   - Monitoring & logging

---

*Documento creado: 2026-01-11*
*Versión: 1.0*
