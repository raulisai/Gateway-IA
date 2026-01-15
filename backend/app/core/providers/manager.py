from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx
import logging

from app.core.providers.base import BaseProvider
from app.core.providers.openai import OpenAIProvider
from app.core.providers.anthropic import AnthropicProvider
from app.core.providers.google import GoogleProvider
from app.core.providers.groq import GroqProvider
from app.schemas.llm import GenerationRequest, GenerationResponse
from app import crud
from app.core.registry import model_registry

logger = logging.getLogger(__name__)

class ProviderManager:
    def __init__(self):
        self._providers: Dict[str, BaseProvider] = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "google": GoogleProvider(),
            "groq": GroqProvider(),
        }

    def get_provider(self, provider_name: str) -> BaseProvider:
        if provider_name not in self._providers:
            raise ValueError(f"Provider {provider_name} not supported.")
        return self._providers[provider_name]

    def _resolve_provider_name(self, model_id: str) -> str:
        # Check registry first
        model_def = model_registry.get_model(model_id)
        if model_def:
            return model_def.provider
        
        # Fallback heuristics if not in registry (though it should be)
        if "gpt" in model_id:
            return "openai"
        elif "claude" in model_id:
            return "anthropic"
        elif "gemini" in model_id:
            return "google"
        elif "llama" in model_id or "mixtral" in model_id or "groq" in model_id:
            return "groq"
        raise ValueError(f"Unknown provider for model {model_id}")

    @retry(
        retry=retry_if_exception_type((httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout, httpx.HTTPStatusError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def execute_request(self, db: Session, request: GenerationRequest, user_id: str) -> GenerationResponse:
        """
        Executes a generation request with automatic retries and key retrieval.
        """
        # 1. Determine provider
        provider_name = self._resolve_provider_name(request.model_id)
        provider = self.get_provider(provider_name)
        
        # 2. Retrieve API Key
        # We need the decrypted key.
        api_key = crud.provider_key.get_decrypted_provider_key(db, user_id=user_id, provider=provider_name)
        
        if not api_key:
            raise ValueError(f"No API key found for provider {provider_name}. Please configure it in settings.")

        # 3. Execute
        try:
            return await provider.generate(request, api_key)
        except httpx.HTTPStatusError as e:
            # Log specific provider errors
            logger.error(f"Provider {provider_name} error: {e.response.text}")
            # If 401/403 -> Authentication error, don't retry, raise immediately
            if e.response.status_code in [401, 403]:
                raise ValueError(f"Invalid API key for {provider_name}.")
            raise # Let tenacity handle 429/5xx

# Global instance
provider_manager = ProviderManager()
