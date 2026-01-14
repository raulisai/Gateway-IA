import httpx
from app.core.providers.base import BaseProvider
from app.schemas.llm import GenerationRequest, GenerationResponse, GenerationUsage, MessageRole

class AnthropicProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "anthropic"

    async def generate(self, request: GenerationRequest, api_key: str) -> GenerationResponse:
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        # Extract system prompt if present
        system_prompt = None
        messages = []
        for m in request.messages:
            if m.role == MessageRole.SYSTEM:
                system_prompt = m.content
            else:
                messages.append({"role": m.role.value, "content": m.content})
        
        payload = {
            "model": request.model_id,
            "messages": messages,
            "max_tokens": request.max_tokens or 1024, # Anthropic requires max_tokens
            "temperature": request.temperature,
            "top_p": request.top_p,
        }
        if system_prompt:
            payload["system"] = system_prompt
        if request.stop_sequences:
            payload["stop_sequences"] = request.stop_sequences

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            content = data["content"][0]["text"]
            finish_reason = data["stop_reason"]
            
            usage = None
            if "usage" in data:
                usage = GenerationUsage(
                    input_tokens=data["usage"]["input_tokens"],
                    output_tokens=data["usage"]["output_tokens"],
                    total_tokens=data["usage"]["input_tokens"] + data["usage"]["output_tokens"]
                )
                
            return GenerationResponse(
                content=content,
                usage=usage,
                model_used=data.get("model", request.model_id),
                finish_reason=finish_reason,
                provider_specific_response=data
            )
