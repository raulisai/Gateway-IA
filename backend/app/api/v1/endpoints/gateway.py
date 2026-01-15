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
from app.core.cache.service import cache_manager
from app.core.usage.logger import usage_logger
from app.schemas.gateway_key import GatewayKeyCreate
import uuid
import time
from app.core.usage.logger import usage_logger
from app.schemas.gateway_key import GatewayKeyCreate
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

from fastapi import Request
from app.core.limiter import limiter

class GatewayRequest(schemas.llm.GenerationRequest):
    # We inherit basic fields like messages, max_tokens, etc.
    # We can add a strategy field here if we want users to control it
    routing_strategy: RoutingStrategy = RoutingStrategy.BALANCED

@router.get("/cache/metrics")
async def get_cache_metrics(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get cache performance metrics.
    """
    # We could restrict this to admins if needed
    return cache_manager.metrics

@router.post("/chat/completions", response_model=GenerationResponse)
@limiter.limit("100/minute")
async def gateway_chat_completions(
    request: Request,
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
        start_time = time.time()
        
        # 0. Auth & Key Setup (needed for logging)
        # Get or create a gateway key for the user (Auto-provision for dashboard)
        user_keys = crud.gateway_key.get_keys_by_user(db, user_id=current_user.id)
        if user_keys:
            gateway_key_id = user_keys[0].id
        else:
            new_key = crud.gateway_key.create_gateway_key(
                db, 
                obj_in=GatewayKeyCreate(name="Default Dashboard Key", rate_limit=1000), 
                user_id=current_user.id, 
                key_hash=f"auto-{uuid.uuid4()}",
                prefix="sk-auto"
            )
            gateway_key_id = new_key.id

        # 1. Classification (Always run to determine complexity for logging)
        classification = request_classifier.analyze(payload.messages)
        logger.info(f"Request classification: {classification.json()}")

        # 2. Cache Lookup (with user_id for isolation)
        cache_params = {
            "max_tokens": payload.max_tokens,
            "temperature": payload.temperature,
            "top_p": payload.top_p,
            "stop_sequences": payload.stop_sequences,
            "routing_strategy": payload.routing_strategy
        }

        cached_response = cache_manager.get_response(payload.messages, cache_params, user_id=current_user.id)
        if cached_response:
            logger.info("Returning cached response")
            # Log Cache Hit
            await usage_logger.log_request(
                db,
                user_id=current_user.id,
                gateway_key_id=gateway_key_id,
                endpoint="/chat/completions",
                provider="cache",
                model=cached_response.model_used,
                complexity=classification.complexity,
                usage=cached_response.usage,
                latency_ms=int((time.time() - start_time) * 1000),
                status_code=200,
                cache_hit=True
            )
            return cached_response

        # 3. Routing
        # Get providers for which the user has keys
        user_keys_db = crud.provider_key.get_provider_keys_by_user(db, user_id=current_user.id)
        available_providers = [pk.provider for pk in user_keys_db]
        
        # Determine strategy: Force COST for simple queries to save money, otherwise respect payload
        strategy = payload.routing_strategy
        if classification.complexity == "simple":
            strategy = RoutingStrategy.COST

        # Determine the best model based on classification result and user strategy
        requirements = RoutingRequirements(
            input_tokens=classification.tokens,
            max_output_tokens=payload.max_tokens or 1024,
            required_features=classification.detected_features,
            provider_preference=classification.recommended_provider # <--- CRITICAL FIX
        )
        
        routing_result = routing_engine.select_model(
            requirements, 
            strategy=strategy,
            available_providers=available_providers
        )
        logger.info(f"Routing result: {routing_result.json()}")
 
        # 4. Execution
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

        # 5. Success Response
        # We might want to inject our internal model id back into the response
        response.model_used = model_def.id
        
        # 6. Cache Store (with user_id for isolation)
        cache_manager.store_response(payload.messages, cache_params, response, user_id=current_user.id)
        
        # 7. Usage Logging
        await usage_logger.log_request(
            db,
            user_id=current_user.id,
            gateway_key_id=gateway_key_id,
            endpoint="/chat/completions",
            provider=model_def.provider,
            model=model_def.id,
            complexity=classification.complexity,
            usage=response.usage,
            latency_ms=int((time.time() - start_time) * 1000), 
            status_code=200,
            cache_hit=False,
            # Pass ML Data
            classification_result=classification,
            routing_result=routing_result
        )
        
        # 8. Enrich Response with Routing Info for Playground/Testing
        complexity_map = {
            "simple": 0.25,
            "moderate": 0.5,
            "complex": 0.75,
            "expert": 1.0
        }
        
        response.routing_info = schemas.llm.RoutingInfo(
            complexity_score=complexity_map.get(classification.complexity, 0.0),
            complexity_level=classification.complexity,
            model_name=model_def.name,
            provider=model_def.provider,
            reasoning=f"Matched complexity level {classification.complexity} with requirements: {classification.detected_features}",
            proposed_models=routing_result.proposed_models
        )

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
