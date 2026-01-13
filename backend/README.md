# LLM Gateway - Backend

Backend modular con FastAPI para el proyecto LLM Gateway.

## Estructura del Proyecto

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py          # Agregador de routers
│   │       └── endpoints/      # Lógica de endpoints
│   ├── core/
│   │   └── config.py          # Configuración global
│   ├── main.py                # Punto de entrada FastAPI
│   ├── schemas/               # Modelos Pydantic
│   └── models/                # Modelos SQLAlchemy (vacio por ahora)
├── tests/                     # Tests con Pytest
├── requirements.txt           # Dependencias
└── run.py                     # Script para ejecutar
```

## Configuración y Ejecución

1. **Crear entorno virtual**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```

2. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecutar tests**:
   ```bash
   pytest
   ```

4. **Ejecutar servidor**:
   ```bash
   python run.py
   ```

La API estará disponible en `http://localhost:8000`.
La documentación Swagger se encuentra en `http://localhost:8000/api/v1/openapi.json` (usado por FastAPI docs).
Interactúa con Swagger en `http://localhost:8000/docs`.

## Endpoints Iniciales
- `GET /health`: Estado del servicio.
- `GET /api/v1/health`: Estado del servicio (v1).
- `GET /`: Mensaje de bienvenida.
