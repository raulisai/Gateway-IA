import httpx
from app.core.providers.base import BaseProvider
from app.schemas.llm import GenerationRequest, GenerationResponse, GenerationUsage, MessageRole

class GoogleProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "google"

    async def generate(self, request: GenerationRequest, api_key: str) -> GenerationResponse:
        # Google Gemini API REST
        # https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{request.model_id}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        # Format messages for Gemini
        # Gemini expects: contents: [{ role: "user"|"model", parts: [{ text: "..." }] }]
        # System instructions are separate in v1beta but simpler to put in prompt for basic support or use system instruction field.
        # Mapping: user -> user, assistant -> model, system -> system_instruction (if supported) or prepend to user.
        
        contents = []
        system_instruction = None
        
        for m in request.messages:
            if m.role == MessageRole.SYSTEM:
                # v1beta supports system_instruction
                system_instruction = {"parts": [{"text": m.content}]}
            elif m.role == MessageRole.USER:
                 contents.append({"role": "user", "parts": [{"text": m.content}]})
            elif m.role == MessageRole.ASSISTANT:
                 contents.append({"role": "model", "parts": [{"text": m.content}]})
                 
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "topP": request.top_p,
                "maxOutputTokens": request.max_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = system_instruction
        if request.stop_sequences:
            payload["generationConfig"]["stopSequences"] = request.stop_sequences

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract content
            try:
                candidate = data["candidates"][0]
                content = candidate["content"]["parts"][0]["text"]
                finish_reason = candidate.get("finishReason")
            except (KeyError, IndexError):
                # Handle safety blocks or empty responses
                content = ""
                finish_reason = "error_or_safety"

            usage = None
            if "usageMetadata" in data:
                usage = GenerationUsage(
                    input_tokens=data["usageMetadata"].get("promptTokenCount", 0),
                    output_tokens=data["usageMetadata"].get("candidatesTokenCount", 0),
                    total_tokens=data["usageMetadata"].get("totalTokenCount", 0)
                )

            return GenerationResponse(
                content=content,
                usage=usage,
                model_used=request.model_id, # Google doesn't always echo back specific version in same field
                finish_reason=finish_reason,
                provider_specific_response=data
            )
