---
tags:
  - documentacion
  - api
  - reference
type: documentation
title: API Reference
created: '2026-01-11'
---
# 📖 API Reference

> Documentación completa de la API del LLM Gateway.

## Base URL

```
Production: https://api.llm-gateway.com
Development: http://localhost:8000
```

## Authentication

Todas las peticiones requieren autenticación mediante Bearer token.

```bash
# Para endpoints de management
Authorization: Bearer <jwt_token>

# Para endpoints de gateway
Authorization: Bearer <gateway_key>
```

## Endpoints

### Gateway API

#### POST /v1/chat/completions

Endpoint principal compatible con OpenAI.

```bash
curl -X POST https://api.llm-gateway.com/v1/chat/completions \
  -H "Authorization: Bearer gw_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | array | Yes | Array de mensajes |
| `model` | string | No | Override modelo |
| `temperature` | number | No | 0-2, default 1 |
| `max_tokens` | number | No | Max tokens response |
| `stream` | boolean | No | Enable streaming |

**Response**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "gpt-4o-mini",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  },
  "gateway_metadata": {
    "routed_to": "gpt-4o-mini",
    "complexity": "simple",
    "cost_usd": 0.000012,
    "latency_ms": 234,
    "cache_hit": false
  }
}
```

### Auth API

#### POST /api/auth/signup

Crear cuenta de usuario.

```bash
curl -X POST /api/auth/signup \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

#### POST /api/auth/login

Autenticación de usuario.

```bash
curl -X POST /api/auth/login \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

**Response**

```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "plan": "free"
  },
  "token": "eyJhbGciOiJIUzI1..."
}
```

### Keys API

#### GET /api/keys/gateway

Listar gateway keys.

```bash
curl -X GET /api/keys/gateway \
  -H "Authorization: Bearer <token>"
```

#### POST /api/keys/gateway

Crear gateway key.

```bash
curl -X POST /api/keys/gateway \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Production Key"}'
```

**Response**

```json
{
  "id": "key_abc123",
  "key": "gw_full_key_shown_once",
  "prefix": "gw_abc12...",
  "name": "Production Key",
  "created_at": "2026-01-11T00:00:00Z"
}
```

#### POST /api/keys/providers

Agregar provider key.

```bash
curl -X POST /api/keys/providers \
  -H "Authorization: Bearer <token>" \
  -d '{"provider": "openai", "api_key": "sk-..."}'
```

### Analytics API

#### GET /api/analytics/overview

Obtener métricas generales.

```bash
curl -X GET "/api/analytics/overview?timeframe=24h" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**

| Param | Type | Default | Options |
|-------|------|---------|---------|
| `timeframe` | string | "24h" | 24h, 7d, 30d |

**Response**

```json
{
  "total_cost": 124.56,
  "total_requests": 5432,
  "avg_latency_ms": 345,
  "cache_hit_rate": 32.5,
  "tokens_used": {
    "input": 543210,
    "output": 234567
  }
}
```

### Models API

#### GET /api/models

Listar modelos disponibles.

```bash
curl -X GET "/api/models?provider=openai"
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `provider` | string | Filtrar por provider |
| `supports_vision` | boolean | Solo modelos con visión |
| `min_context` | number | Context window mínimo |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Input inválido |
| 401 | Unauthorized - Token inválido |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Error - Error servidor |
| 503 | Service Unavailable - Provider caído |

## Rate Limits

| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 20 | 1,000 |
| Pro | 60 | 10,000 |
| Enterprise | Unlimited | Unlimited |

---

*Ver también: [[setup-guide|Setup Guide]] | [[configuration|Configuration]]*
