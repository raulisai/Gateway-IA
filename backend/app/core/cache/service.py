import hashlib
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from cachetools import TTLCache
import time

from app.schemas.llm import Message, GenerationResponse

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self, maxsize: int = 1000, ttl: int = 3600):
        """
        Initialize the Cache Manager.
        
        Args:
            maxsize: Maximum number of items in the cache.
            ttl: Time-to-live for cache items in seconds (default 1 hour).
        """
        self._cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self._hits = 0
        self._misses = 0

    def _generate_key(self, messages: List[Message], params: Dict[str, Any]) -> str:
        """
        Generate a unique cache key based on messages and request parameters.
        """
        # Convert messages to a stable list of dicts
        msg_data = [m.model_dump() if hasattr(m, 'model_dump') else m.dict() for m in messages]
        
        # Sort params to ensure consistent hashing
        sorted_params = {k: params[k] for k in sorted(params.keys()) if params[k] is not None}
        
        # Create a payload for hashing
        payload = {
            "messages": msg_data,
            "params": sorted_params
        }
        
        # Serialize and hash
        payload_str = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(payload_str.encode()).hexdigest()

    def get_response(self, messages: List[Message], params: Dict[str, Any]) -> Optional[GenerationResponse]:
        """
        Retrieve a response from the cache if available.
        """
        key = self._generate_key(messages, params)
        response = self._cache.get(key)
        
        if response:
            self._hits += 1
            logger.info(f"Cache HIT for key: {key[:8]}...")
            return response
        
        self._misses += 1
        logger.info(f"Cache MISS for key: {key[:8]}...")
        return None

    def store_response(self, messages: List[Message], params: Dict[str, Any], response: GenerationResponse):
        """
        Store a response in the cache.
        """
        key = self._generate_key(messages, params)
        self._cache[key] = response
        logger.info(f"Stored response in cache with key: {key[:8]}...")

    @property
    def metrics(self) -> Dict[str, Any]:
        """
        Get cache performance metrics.
        """
        total = self._hits + self._misses
        hit_rate = (self._hits / total) if total > 0 else 0
        
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": hit_rate,
            "current_size": len(self._cache),
            "max_size": self._cache.maxsize,
            "ttl": self._cache.ttl
        }

# Global instance
cache_manager = CacheManager()
