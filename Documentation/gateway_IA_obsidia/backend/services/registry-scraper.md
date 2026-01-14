---
title: Registry Scraper Service
type: service
layer: backend
created: 2026-01-14
tags:
  - backend
  - service
  - scraper
  - models
  - registry
---

# 🔄 Registry Scraper Service

> Servicio encargado de mantener actualizado el catálogo de modelos LLM mediante scraping automatizado de páginas oficiales de pricing.

## 📋 Propósito

El Registry Scraper elimina la necesidad de un contenedor separado para actualizaciones, integrando el scraping directamente en el backend con:
- **Endpoint manual** para disparar actualizaciones on-demand
- **Cron job** dentro del contenedor backend para ejecuciones automáticas
- **Scrapers especializados** por proveedor (OpenAI, Anthropic, Google)

## 🏗️ Arquitectura

```mermaid
graph TB
    subgraph "Trigger Methods"
        Manual[Manual Trigger<br/>POST /api/admin/update-registry]
        Cron[Cron Job<br/>Daily 3:00 AM]
    end
    
    subgraph "Registry Scraper Service"
        Orchestrator[Scraper Orchestrator]
        OpenAIScraper[OpenAI Scraper]
        AnthropicScraper[Anthropic Scraper]
        GoogleScraper[Google Scraper]
    end
    
    subgraph "Processing"
        Validate[Validate Structure]
        Compare[Compare Versions]
        Backup[Create Backup]
        Write[Write models.json]
        Reload[Reload Registry]
    end
    
    subgraph "Storage"
        Current[models.json]
        BackupFile[models.json.bak]
        Changelog[(registry_changelog)]
    end
    
    Manual --> Orchestrator
    Cron --> Orchestrator
    
    Orchestrator --> OpenAIScraper
    Orchestrator --> AnthropicScraper
    Orchestrator --> GoogleScraper
    
    OpenAIScraper & AnthropicScraper & GoogleScraper --> Validate
    Validate --> Compare
    Compare --> Backup
    Backup --> BackupFile
    Compare --> Write
    Write --> Current
    Write --> Changelog
    Write --> Reload
    
    style Manual fill:#3498db
    style Cron fill:#9b59b6
    style Orchestrator fill:#e74c3c
```

## 🔌 Scrapers por Proveedor

### OpenAI Scraper

```mermaid
graph LR
    Start[Iniciar] --> Fetch[Fetch HTML<br/>openai.com/api/pricing]
    Fetch --> Parse[Parse con<br/>BeautifulSoup]
    Parse --> Extract[Extraer:<br/>- Model ID<br/>- Input Price<br/>- Output Price<br/>- Context Window]
    Extract --> Normalize[Normalizar a<br/>formato estándar]
    Normalize --> Return[Return Models List]
    
    style Fetch fill:#10a37f
```

**URL Target:** `https://openai.com/api/pricing/`

**Datos Extraídos:**
- `model_id`: "gpt-4o", "gpt-4o-mini", etc.
- `pricing.prompt`: USD por 1M tokens de entrada
- `pricing.completion`: USD por 1M tokens de salida
- `specs.context_window`: Tokens máximos
- `specs.capabilities`: ["text", "vision", "function_calling"]

### Anthropic Scraper

```mermaid
graph LR
    Start[Iniciar] --> Fetch[Fetch HTML<br/>anthropic.com/pricing]
    Fetch --> Parse[Parse con<br/>BeautifulSoup]
    Parse --> Extract[Extraer:<br/>- Model ID<br/>- Pricing<br/>- Capabilities]
    Extract --> Normalize[Normalizar]
    Normalize --> Return[Return Models List]
    
    style Fetch fill:#cc785c
```

**URL Target:** `https://www.anthropic.com/pricing`

**Datos Extraídos:**
- `model_id`: "claude-3-5-sonnet", "claude-3-haiku", etc.
- Precios de input/output por millón de tokens
- Context window y capabilities

### Google AI Scraper

```mermaid
graph LR
    Start[Iniciar] --> Fetch[Fetch HTML<br/>ai.google.dev/pricing]
    Fetch --> Parse[Parse HTML/JSON]
    Parse --> Extract[Extraer:<br/>- Gemini Models<br/>- Pricing<br/>- Specs]
    Extract --> Normalize[Normalizar]
    Normalize --> Return[Return Models List]
    
    style Fetch fill:#4285f4
```

**URL Target:** `https://ai.google.dev/pricing`

**Datos Extraídos:**
- `model_id`: "gemini-2.0-flash", "gemini-1.5-pro", etc.
- Precios por millón de tokens
- Multimodal capabilities

## 🔄 Flujo de Actualización

```mermaid
sequenceDiagram
    autonumber
    participant Trigger as Trigger<br/>(Cron/Manual)
    participant API as Admin Endpoint
    participant Orch as Orchestrator
    participant Scrapers as Scrapers
    participant Val as Validator
    participant FS as File System
    participant Reg as Model Registry
    participant Log as Changelog
    
    Trigger->>API: Trigger update
    API->>Orch: start_update()
    
    par Scrape All Providers
        Orch->>Scrapers: scrape_openai()
        Scrapers-->>Orch: openai_models[]
        Orch->>Scrapers: scrape_anthropic()
        Scrapers-->>Orch: anthropic_models[]
        Orch->>Scrapers: scrape_google()
        Scrapers-->>Orch: google_models[]
    end
    
    Orch->>Val: validate_structure(all_models)
    
    alt Invalid Structure
        Val-->>Orch: ValidationError
        Orch-->>API: Return error
    else Valid Structure
        Val-->>Orch: OK
        
        Orch->>FS: read(models.json)
        FS-->>Orch: current_registry
        
        Orch->>Orch: detect_changes(current, new)
        
        alt No Changes
            Orch-->>API: No updates needed
        else Has Changes
            Orch->>FS: copy(models.json → models.json.bak)
            Orch->>FS: write(models.json, new_data)
            Orch->>Log: insert(changelog_entry)
            Orch->>Reg: reload()
            Orch-->>API: Success + changes summary
        end
    end
    
    API-->>Trigger: Response
```

## 🛠️ Implementación

### Endpoint Manual

```python
# Pseudocódigo conceptual
@router.post("/api/admin/update-registry")
async def update_registry(
    current_user: User = Depends(require_admin)
):
    """
    Endpoint protegido para actualización manual del registry.
    Solo accesible por usuarios con rol admin.
    """
    try:
        # 1. Ejecutar scrapers
        openai_models = await scrape_openai_models()
        anthropic_models = await scrape_anthropic_models()
        google_models = await scrape_google_models()
        
        # 2. Consolidar y validar
        all_models = openai_models + anthropic_models + google_models
        validate_registry_structure(all_models)
        
        # 3. Detectar cambios
        current_registry = load_current_registry()
        changes = detect_changes(current_registry, all_models)
        
        if not changes:
            return {"message": "No changes detected"}
        
        # 4. Backup y actualización
        backup_registry()
        write_registry(all_models)
        log_changes(changes)
        
        # 5. Reload en memoria
        model_registry.reload()
        
        return {
            "success": True,
            "version": new_version,
            "changes": changes
        }
    except Exception as e:
        logger.error(f"Registry update failed: {e}")
        rollback_registry()
        raise HTTPException(500, "Update failed")
```

### Cron Job Configuration

**Dockerfile:**
```dockerfile
# Instalar cron
RUN apt-get update && apt-get install -y cron curl

# Copiar script de actualización
COPY scripts/cron_update_registry.sh /app/scripts/
RUN chmod +x /app/scripts/cron_update_registry.sh

# Configurar crontab (3:00 AM diario)
RUN echo "0 3 * * * /app/scripts/cron_update_registry.sh >> /var/log/registry_update.log 2>&1" | crontab -

# Iniciar cron junto con uvicorn
CMD ["sh", "-c", "cron && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

**Script: cron_update_registry.sh**
```bash
#!/bin/bash
# Script ejecutado por cron para actualizar registry

echo "[$(date)] Starting registry update..."

# Admin token desde variable de entorno
ADMIN_TOKEN=${ADMIN_API_KEY:-""}

if [ -z "$ADMIN_TOKEN" ]; then
    echo "[$(date)] ERROR: ADMIN_API_KEY not set"
    exit 1
fi

# Llamar al endpoint
RESPONSE=$(curl -s -X POST http://localhost:8000/api/admin/update-registry \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")

echo "[$(date)] Response: $RESPONSE"
echo "[$(date)] Registry update completed"
```

## 🔍 Detección de Cambios

```mermaid
graph TB
    Start[Comparar Registries] --> CheckModels{Modelos<br/>diferentes?}
    
    CheckModels -->|Nuevos IDs| NewModels[Detectar Nuevos<br/>Modelos]
    CheckModels -->|IDs removidos| DepModels[Detectar Modelos<br/>Deprecados]
    CheckModels -->|IDs comunes| CheckPrices{Precios<br/>cambiaron?}
    
    CheckPrices -->|Sí| PriceChange[Registrar Cambio<br/>de Precio]
    CheckPrices -->|No| CheckSpecs{Specs<br/>cambiaron?}
    
    CheckSpecs -->|Sí| SpecChange[Registrar Cambio<br/>de Specs]
    CheckSpecs -->|No| NoChange[Sin Cambios]
    
    NewModels --> Changelog
    DepModels --> Changelog
    PriceChange --> Changelog
    SpecChange --> Changelog
    NoChange --> End[Fin]
    Changelog --> End
    
    style NewModels fill:#27ae60
    style DepModels fill:#e74c3c
    style PriceChange fill:#f39c12
    style SpecChange fill:#3498db
```

### Ejemplo de Changelog Entry

```json
{
  "timestamp": "2026-01-14T03:00:15Z",
  "version": "1.3.0",
  "changes": [
    {
      "type": "price_update",
      "model": "gpt-4o",
      "old_price": {"prompt": 2.50, "completion": 10.00},
      "new_price": {"prompt": 2.00, "completion": 8.00}
    },
    {
      "type": "model_added",
      "model": "gpt-4-turbo-2024-04",
      "pricing": {"prompt": 5.00, "completion": 15.00}
    },
    {
      "type": "model_deprecated",
      "model": "gpt-3.5-turbo-0301"
    }
  ]
}
```

## 📊 Monitoreo

### Métricas Importantes

```mermaid
graph LR
    subgraph "Success Metrics"
        SR[Scraping Success Rate]
        UT[Update Time]
        CH[Changes Detected]
    end
    
    subgraph "Error Metrics"
        SF[Scraping Failures]
        TO[Timeouts]
        VE[Validation Errors]
    end
    
    subgraph "Alerts"
        A1[3 fallos consecutivos]
        A2[Cambios de precio >20%]
        A3[Nuevos modelos]
    end
    
    SR --> A1
    SF --> A1
    CH --> A2
    CH --> A3
```

### Logs Estructurados

```json
{
  "timestamp": "2026-01-14T03:00:00Z",
  "event": "registry_update",
  "status": "success",
  "duration_ms": 4532,
  "scrapers": {
    "openai": {"status": "success", "models": 12},
    "anthropic": {"status": "success", "models": 8},
    "google": {"status": "success", "models": 6}
  },
  "changes": {
    "added": 1,
    "updated": 3,
    "deprecated": 0
  }
}
```

## ⚠️ Consideraciones

### Scraping Ethics
- ✅ Respetar `robots.txt` de cada sitio
- ✅ Rate limiting entre requests (2-3s delay)
- ✅ User-Agent identificable: `LLMGateway-Scraper/1.0`
- ❌ No hacer requests excesivos

### Fallback Strategy
```mermaid
graph TB
    Scrape[Intentar Scraping] --> Success{Éxito?}
    Success -->|Sí| Update[Actualizar Registry]
    Success -->|No| Retry{Reintentos<br/>disponibles?}
    Retry -->|Sí| Wait[Esperar 5min]
    Wait --> Scrape
    Retry -->|No| Keep[Mantener Registry<br/>Actual]
    Keep --> Alert[Enviar Alerta]
    
    style Keep fill:#e74c3c
    style Alert fill:#c0392b
```

### Validación Estricta
Antes de actualizar, validar:
- ✅ Estructura JSON correcta
- ✅ Campos requeridos presentes
- ✅ Precios son números positivos
- ✅ Model IDs únicos
- ✅ Versión incrementada

## 🔗 Documentos Relacionados

- [[../api-routes|API Routes]] - Endpoint de admin
- [[model-registry|Model Registry]] - Servicio que consume el registry
- [[../../arquitectura/backend-architecture|Backend Architecture]]

---

*Última actualización: 2026-01-14*
