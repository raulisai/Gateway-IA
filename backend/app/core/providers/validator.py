import httpx
from typing import Optional

async def validate_openai_key(api_key: str) -> bool:
    """Validate OpenAI API key by calling /v1/models"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0
            )
            return response.status_code == 200
        except Exception:
            return False

async def validate_anthropic_key(api_key: str) -> bool:
    """Validate Anthropic API key by calling /v1/messages (dry run or simple)"""
    # Anthropic doesn't have a simple GET /models that is widely used for validaiton in the same way,
    # but we can try a dummy message or a known endpoint.
    async with httpx.AsyncClient() as client:
        try:
            # We use the metadata endpoint or just try a list models if they have one
            # Actually, Anthropic uses x-api-key header.
            response = await client.get(
                "https://api.anthropic.com/v1/models", # If available, otherwise we use messages
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                timeout=10.0
            )
            return response.status_code == 200
        except Exception:
            return False

async def validate_google_key(api_key: str) -> bool:
    """Validate Google API key by calling /v1beta/models"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
                timeout=10.0
            )
            return response.status_code == 200
        except Exception:
            return False


async def validate_groq_key(api_key: str) -> bool:
    """Validate Groq API key by calling /openai/v1/models"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0
            )
            return response.status_code == 200
        except Exception:
            return False

async def validate_provider_key(provider: str, api_key: str) -> bool:
    """Generic validator for provider keys"""
    if provider == "openai":
        return await validate_openai_key(api_key)
    elif provider == "anthropic":
        return await validate_anthropic_key(api_key)
    elif provider == "google":
        return await validate_google_key(api_key)
    elif provider == "groq":
        return await validate_groq_key(api_key)
    return False
