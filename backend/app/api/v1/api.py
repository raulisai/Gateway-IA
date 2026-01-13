from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, keys, provider_keys, models

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(keys.router, prefix="/keys", tags=["keys"])
api_router.include_router(provider_keys.router, prefix="/keys/providers", tags=["provider_keys"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
