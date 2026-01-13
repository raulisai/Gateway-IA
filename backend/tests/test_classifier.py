import pytest
from app.core.classifier.service import request_classifier
from app.core.classifier.tokenizer import token_counter

def test_token_counter_basic():
    text = "Hello world, this is a test."
    count = token_counter.count_tokens(text)
    # "Hello world, this is a test." is ~7-8 tokens depending on whitespace handling by cl100k
    assert count > 0

def test_token_counter_messages():
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"}
    ]
    count = token_counter.count_messages(messages)
    assert count > 0

def test_classifier_simple():
    text = "What is the capital of France?"
    result = request_classifier.analyze(text)
    assert result.complexity == "simple"
    assert "simple" in result.reasoning.lower()

def test_classifier_code_detection():
    text = "def calculate_fibonacci(n): return n if n <= 1 else calculate_fibonacci(n-1) + calculate_fibonacci(n-2)"
    result = request_classifier.analyze(text)
    assert "code" in result.detected_features
    assert result.complexity in ["complex", "expert"] # Technical content bumps it
    
def test_classifier_length_threshold():
    # Generate dummy long text
    long_text = "test " * 1000 # ~1000 tokens
    result = request_classifier.analyze(long_text)
    # Check thresholds defined in service (500, 3000, 15000)
    # 1000 tokens is > 500 but < 3000 -> MODERATE
    # But wait, token count of "test " is 1 token per word usually.
    # So 1000 words is ~1000 tokens. 
    # Logic: < 500 (SIMPLE), 500-3000 (MODERATE)
    assert result.complexity == "moderate" or result.complexity == "complex" 

def test_classifier_chat_format():
    messages = [
        {"role": "user", "content": "Can you help me write a SQL query?"},
        {"role": "user", "content": "SELECT * FROM users"}
    ]
    result = request_classifier.analyze(messages)
    assert "sql" in result.detected_features
    assert result.complexity != "simple"
