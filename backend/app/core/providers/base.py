from abc import ABC, abstractmethod
from app.schemas.llm import GenerationRequest, GenerationResponse

class BaseProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name (e.g., 'openai', 'anthropic')"""
        pass

    @abstractmethod
    async def generate(self, request: GenerationRequest, api_key: str) -> GenerationResponse:
        """
        Execute a generation request against the provider API.
        Must handle its own HTTP calls and response normalization.
        """
        pass
