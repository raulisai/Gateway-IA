import pytest
import time
from app.core.cache.service import CacheManager
from app.schemas.llm import Message, MessageRole, GenerationResponse, GenerationUsage

def test_cache_key_consistency():
    cache = CacheManager()
    messages = [Message(role=MessageRole.USER, content="Hello")]
    params = {"temp": 0.7, "max": 100}
    
    key1 = cache._generate_key(messages, params)
    key2 = cache._generate_key(messages, params)
    
    assert key1 == key2

def test_cache_hit_miss():
    cache = CacheManager()
    messages = [Message(role=MessageRole.USER, content="Hello")]
    params = {"temp": 0.7}
    response = GenerationResponse(content="Hi there", model_used="test-model", usage=GenerationUsage(input_tokens=1, output_tokens=1, total_tokens=2))
    
    # Initial miss
    assert cache.get_response(messages, params) is None
    assert cache.metrics["misses"] == 1
    assert cache.metrics["hits"] == 0
    
    # Store and hit
    cache.store_response(messages, params, response)
    cached = cache.get_response(messages, params)
    assert cached is not None
    assert cached.content == "Hi there"
    assert cache.metrics["hits"] == 1
    assert cache.metrics["misses"] == 1

def test_cache_eviction():
    # Small cache to test eviction
    cache = CacheManager(maxsize=2)
    
    msg1 = [Message(role=MessageRole.USER, content="1")]
    msg2 = [Message(role=MessageRole.USER, content="2")]
    msg3 = [Message(role=MessageRole.USER, content="3")]
    res = GenerationResponse(content="res", model_used="m", usage=GenerationUsage(input_tokens=1, output_tokens=1, total_tokens=2))
    
    cache.store_response(msg1, {}, res)
    cache.store_response(msg2, {}, res)
    
    assert cache.get_response(msg1, {}) is not None
    assert cache.get_response(msg2, {}) is not None
    
    # Add 3rd item, should evict one (likely LRU)
    cache.store_response(msg3, {}, res)
    
    # One of the first two should be gone, or third is present
    assert cache.metrics["current_size"] == 2
    assert cache.get_response(msg3, {}) is not None

def test_cache_ttl():
    # Cache with very short TTL
    cache = CacheManager(ttl=1)
    msg = [Message(role=MessageRole.USER, content="TTL")]
    res = GenerationResponse(content="res", model_used="m", usage=GenerationUsage(input_tokens=1, output_tokens=1, total_tokens=2))
    
    cache.store_response(msg, {}, res)
    assert cache.get_response(msg, {}) is not None
    
    # Wait for TTL to expire
    time.sleep(1.1)
    assert cache.get_response(msg, {}) is None
    assert cache.metrics["misses"] == 1
