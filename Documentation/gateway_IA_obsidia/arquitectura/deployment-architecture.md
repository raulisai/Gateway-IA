---
title: Arquitectura de Deployment
type: architecture
layer: infrastructure
created: '2026-01-11'
tags:
  - arquitectura
  - deployment
  - docker
  - infrastructure
---
# 🚢 Arquitectura de Deployment

> Estrategia de despliegue, infraestructura y operaciones del sistema.

## Vista de Deployment

```mermaid
graph TB
    subgraph "Internet"
        Users[👥 Users]
        DevApps[📱 Developer Apps]
    end
    
    subgraph "Edge Layer"
        CDN[CloudFlare CDN<br/>Static Assets]
        DNS[DNS<br/>A Record]
    end
    
    subgraph "Host Server"
        Nginx[Nginx<br/>Reverse Proxy<br/>SSL Termination]
        
        subgraph "Docker Compose Stack"
            Frontend[Frontend<br/>Next.js :3000]
            Backend[Backend<br/>FastAPI :8000<br/>+ Cron Job]
        end
        
        subgraph "Shared Volume"
            DB[(gateway.db)]
            Registry[models.json]
            RegistryBackup[models.json.bak]
        end
    end
    
    subgraph "External Services"
        OpenAIPricing[OpenAI<br/>Pricing Page]
        AnthropicPricing[Anthropic<br/>Pricing Page]
        GooglePricing[Google<br/>Pricing Page]
    end
    
    Users --> CDN
    DevApps --> DNS
    CDN --> Nginx
    DNS --> Nginx
    
    Nginx -->|/| Frontend
    Nginx -->|/api, /v1| Backend
    
    Frontend --> Backend
    Backend --> DB
    Backend --> Registry
    Backend --> RegistryBackup
    
    Backend --> OpenAIPricing & AnthropicPricing & GooglePricing
    
    style Nginx fill:#009639
    style Frontend fill:#61dafb
    style Backend fill:#009688
    style DB fill:#003b57
```

## Docker Compose Configuration

```mermaid
graph LR
    subgraph "docker-compose.yml"
        Frontend[frontend<br/>build: ./frontend<br/>port: 3000]
        Backend[backend<br/>build: ./backend<br/>port: 8000<br/>+ cron service]
    end
    
    subgraph "Volumes"
        DataVol[data/<br/>Persistent<br/>DB + Registry]
    end
    
    subgraph "Networks"
        Net[gateway-network<br/>bridge]
    end
    
    Frontend -.-> Net
    Backend -.-> Net
    
    Frontend --> DataVol
    Backend --> DataVol
    
    style DataVol fill:#f39c12
```

## Configuración de Servicios

### Frontend Container
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
  environment:
    - NEXT_PUBLIC_API_URL=http://backend:8000
  depends_on:
    - backend
  networks:
    - gateway-network
  restart: unless-stopped
```

### Backend Container
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  environment:
    - DATABASE_URL=sqlite:///./data/gateway.db
    - SECRET_KEY=${SECRET_KEY}
    - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    - ADMIN_API_KEY=${ADMIN_API_KEY}  # Para cron job
  volumes:
    - ./data:/app/data
  networks:
    - gateway-network
  restart: unless-stopped
  command: sh -c "cron && uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

**Nota:** El backend ahora incluye:
- Servicio web FastAPI (puerto 8000)
- Cron job interno que ejecuta registry scraping diariamente
- Endpoint manual `/api/admin/update-registry` para updates on-demand

## Ciclo de Deployment

```mermaid
graph TB
    subgraph "Development"
        Dev[👨‍💻 Developer]
        LocalTest[Local Testing<br/>docker-compose up]
    end
    
    subgraph "CI/CD Pipeline"
        Push[Git Push]
        Actions[GitHub Actions]
        Build[Build Images]
        Test[Run Tests]
        Security[Security Scan]
        Push2Reg[Push to Registry]
    end
    
    subgraph "Deployment"
        Pull[Pull Images]
        Deploy[docker-compose up -d]
        Migrate[Run Migrations]
        Health[Health Check]
    end
    
    subgraph "Production"
        Server[Production Server]
    end
    
    Dev --> LocalTest
    LocalTest --> Push
    Push --> Actions
    Actions --> Build --> Test --> Security --> Push2Reg
    Push2Reg --> Pull
    Pull --> Deploy --> Migrate --> Health
    Health --> Server
    
    style Actions fill:#2088FF
    style Server fill:#27ae60
```

## Estrategia de Scaling

### Horizontal Scaling (Futuro)
```mermaid
graph TB
    LB[Load Balancer<br/>Nginx/HAProxy]
    
    subgraph "Backend Replicas"
        B1[Backend 1]
        B2[Backend 2]
        B3[Backend N]
    end
    
    subgraph "Frontend Replicas"
        F1[Frontend 1]
        F2[Frontend 2]
    end
    
    subgraph "Shared State"
        Redis[(Redis<br/>Cache + Sessions)]
        Postgres[(PostgreSQL<br/>Primary DB)]
    end
    
    LB --> F1 & F2
    LB --> B1 & B2 & B3
    
    B1 & B2 & B3 --> Redis
    B1 & B2 & B3 --> Postgres
    
    style LB fill:#e74c3c
    style Redis fill:#dc382d
    style Postgres fill:#336791
```

## Monitoreo y Observabilidad

```mermaid
graph TB
    subgraph "Application"
        App[LLM Gateway]
        Metrics[Prometheus Metrics<br/>/metrics]
        Logs[Structured Logs<br/>JSON format]
    end
    
    subgraph "Collection"
        Prometheus[Prometheus<br/>Metrics scraping]
        Loki[Loki<br/>Log aggregation]
    end
    
    subgraph "Visualization"
        Grafana[Grafana<br/>Dashboards]
        Alerts[Alert Manager<br/>Notifications]
    end
    
    subgraph "Notifications"
        Slack[Slack]
        Email[Email]
        PagerDuty[PagerDuty]
    end
    
    App --> Metrics --> Prometheus
    App --> Logs --> Loki
    
    Prometheus --> Grafana
    Loki --> Grafana
    
    Prometheus --> Alerts
    Alerts --> Slack & Email & PagerDuty
    
    style Grafana fill:#F46800
    style Prometheus fill:#E6522C
```

## Health Checks

```mermaid
graph LR
    subgraph "Endpoints"
        Health[/health<br/>Basic check]
        Ready[/ready<br/>Dependencies]
        Live[/live<br/>Liveness probe]
    end
    
    subgraph "Checks"
        DB[Database<br/>Connection]
        Registry[Registry<br/>Loaded]
        Providers[Providers<br/>Reachable]
    end
    
    Ready --> DB & Registry
    Live --> DB
    
    style Health fill:#27ae60
    style Ready fill:#3498db
```

## Backup y Disaster Recovery

```mermaid
graph TB
    subgraph "Backup Schedule"
        Daily[Daily<br/>00:00 UTC]
        Weekly[Weekly<br/>Sunday]
        Monthly[Monthly<br/>1st day]
    end
    
    subgraph "Backup Types"
        DBBackup[Database Backup<br/>SQLite copy]
        ConfigBackup[Config Backup<br/>Environment]
        RegistryBackup[Registry Backup<br/>models.json]
    end
    
    subgraph "Storage"
        Local[Local Storage<br/>./backups/]
        S3[S3 Bucket<br/>Long-term]
    end
    
    subgraph "Recovery"
        RTO[RTO: 30 min]
        RPO[RPO: 24 hours]
    end
    
    Daily --> DBBackup & RegistryBackup
    Weekly --> ConfigBackup
    
    DBBackup --> Local --> S3
    
    style Daily fill:#3498db
    style RTO fill:#e74c3c
```

## Configuración de Seguridad

| Aspecto | Configuración |
|---------|---------------|
| SSL/TLS | Let's Encrypt, auto-renew |
| Firewall | Solo puertos 80, 443 |
| Rate Limiting | 100 req/min por IP |
| Secrets | Environment variables |
| Headers | CORS, CSP, HSTS |

## Comandos de Deployment

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Update images
docker-compose pull && docker-compose up -d

# Backup database
docker-compose exec backend cp /app/data/gateway.db /app/data/backups/

# Run migrations
docker-compose exec backend alembic upgrade head
```

## Documentos Relacionados

- [[overview|Arquitectura General]]
- [[../documentacion/setup-guide|Guía de Setup]]
- [[../documentacion/configuration|Configuración]]

---

*Ver también: [[../roadmap/fase-3-scale|Fase 3: Escalabilidad]]*
