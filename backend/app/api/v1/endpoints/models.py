from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.registry import model_registry
from app.schemas.registry import ModelDefinition
from app import models
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[ModelDefinition])
def list_models(
    provider: Optional[str] = Query(None, description="Filter models by provider (openai, anthropic, google)"),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    List all available models in the registry.
    """
    return model_registry.list_models(provider=provider)

@router.get("/{model_id}", response_model=ModelDefinition)
def get_model(
    model_id: str,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get details of a specific model.
    """
    model = model_registry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model
