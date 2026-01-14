from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import logging

from app import crud, models, schemas
from app.api import deps
from app.core.classifier.service import request_classifier
from app.core.router.engine import routing_engine
from app.core.providers.manager import provider_manager
from app.schemas.router import RoutingRequirements, RoutingStrategy
from app.schemas.llm import GenerationRequest, GenerationResponse
from app.core.registry import model_registry

router = APIRouter()
logger = logging.getLogger(__name__)

class GatewayRequest(schemas.llm.GenerationRequest):
    # We inherit basic fields like messages, max_tokens, etc.
    # We can add a strategy field here if we want users to control it
    routing_strategy: RoutingStrategy = RoutingStrategy.BALANCED

@router.post("/chat/completions", response_model=GenerationResponse)
async def gateway_chat_completions(
    *,
    db: Session = Depends(deps.get_db),
    payload: GatewayRequest,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Main Gateway Endpoint.
    Orchestrates classification, intelligent routing, and multi-provider execution.
    """
    try:
        # 1. Classification
        # Analyze messages to detect complexity and features
        classification = request_classifier.analyze(payload.messages)
        logger.info(f"Request classification: {classification.json()}")

        # 2. Routing
        # Get providers for which the user has keys
        user_keys = crud.provider_key.get_provider_keys_by_user(db, user_id=current_user.id)
        available_providers = [pk.provider for pk in user_keys]
        
        # Determine the best model based on classification result and user strategy
        requirements = RoutingRequirements(
            input_tokens=classification.tokens,
            max_output_tokens=payload.max_tokens or 1024,
            required_features=classification.detected_features,
            # we could add more constraints from payload here
        )
        
        routing_result = routing_engine.select_model(
            requirements, 
            strategy=payload.routing_strategy,
            available_providers=available_providers
        )
        logger.info(f"Routing result: {routing_result.json()}")

        # 3. Execution
        # Find the original model ID in registry
        model_def = model_registry.get_model(routing_result.selected_model_id)
        if not model_def:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Selected model not found in registry."
            )

        # Prepare execution request
        # Note: We use the original_model_id for the provider call
        exec_request = GenerationRequest(
            messages=payload.messages,
            model_id=model_def.original_model_id,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
            top_p=payload.top_p,
            stop_sequences=payload.stop_sequences
        )

        response = await provider_manager.execute_request(
            db, 
            exec_request, 
            user_id=current_user.id
        )

        # 4. Success Response
        # We might want to inject our internal model id back into the response
        response.model_used = model_def.id
        return response

    except ValueError as e:
        # Business logic errors (e.g. no models found, auth issues with provider)
        logger.error(f"Gateway logic error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors
        logger.exception("Unexpected error in gateway endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during processing: {str(e)}"
        )
