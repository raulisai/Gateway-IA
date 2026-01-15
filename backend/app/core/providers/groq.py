import httpx
from app.core.providers.base import BaseProvider
from app.schemas.llm import GenerationRequest, GenerationResponse, GenerationUsage

class GroqProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "groq"

    async def generate(self, request: GenerationRequest, api_key: str) -> GenerationResponse:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Groq is OpenAI-compatible
        messages = [{"role": m.role.value, "content": m.content} for m in request.messages]
        
        payload = {
            "model": request.model_id,
            "messages": messages,
            "temperature": request.temperature,
            "top_p": request.top_p,
            "stream": False # We don't support streaming yet in this simple provider
        }
        if request.max_completion_tokens:
             payload["max_completion_tokens"] = request.max_completion_tokens
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens
        if request.stop_sequences:
            payload["stop"] = request.stop_sequences

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Normalize response
            choice = data["choices"][0]
            content = choice["message"]["content"]
            finish_reason = choice["finish_reason"]
            
            usage = None
            if "usage" in data:
                usage = GenerationUsage(
                    input_tokens=data["usage"]["prompt_tokens"],
                    output_tokens=data["usage"]["completion_tokens"],
                    total_tokens=data["usage"]["total_tokens"]
                )
                
            return GenerationResponse(
                content=content,
                usage=usage,
                model_used=data.get("model", request.model_id),
                finish_reason=finish_reason,
                provider_specific_response=data
            )
