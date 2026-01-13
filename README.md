# LLM Gateway - Setup Guide

Este proyecto es un enrutador inteligente para APIs de modelos de lenguaje (LLMs). Sigue estos pasos para levantar el ambiente de desarrollo.

## 📋 Requisitos Previos

- **Docker Desktop** instalado y en ejecución.
- **Python 3.11+** (para ejecución local de tests y scripts).
- **Node.js 18+** (opcional, para desarrollo local fuera de Docker).

## 🚀 Instalación y Setup

### 1. Preparar el archivo de entorno
Crea una copia del archivo `.env.example` y nómbralo `.env`:

```bash
cp .env.example .env
```

Edita `.env` y define las llaves maestras:
- `SECRET_KEY`: Una cadena aleatoria para los tokens JWT.
- `MASTER_ENCRYPTION_KEY`: Una cadena de 32 caracteres para encriptar tus API keys en la base de datos.

### 2. Levantar los servicios con Docker
Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up --build
```

Esto levantará 3 servicios:
- **Backend (FastAPI)**: Accesible en `http://localhost:8000`
- **Frontend (Next.js)**: Accesible en `http://localhost:3000`
- **Updater**: Servicio interno de sincronización.

### 3. Verificar el ambiente
Una vez que los contenedores estén corriendo, puedes validar que todo está correcto ejecutando:

```bash
pip install requests
python tests/validate_env.py
```

## 🛠️ Estructura del Proyecto

- `backend/`: Lógica de API, enrutamiento y base de datos.
- `frontend/`: Interfaz de usuario (Dashboard).
- `updater/`: Sincronización automática de precios y modelos.
- `data/`: Volumen persistente para la base de datos SQLite.
- `Documentation/`: Guías detalladas y especificaciones técnicas.

## 📄 Documentación Relevante
Para más detalles técnicos, consulta:
- [Especificación Técnica](Documentation/ESPECIFICACION-TECNICA-DEVELOPER.md)
- [Resumen Integral](Documentation/RESUMEN-INTEGRAL.md)
