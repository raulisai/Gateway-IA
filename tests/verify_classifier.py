import sys
import os

# Add the backend directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.core.classifier.service import request_classifier

def test_case(name, prompt, expected_complexity=None, expected_provider=None, min_score=None):
    print(f"\n--- Testing: {name} ---")
    print(f"Prompt: {prompt[:100]}...")
    
    result = request_classifier.analyze(prompt)
    
    print(f"Tokens: {result.tokens}")
    print(f"Features: {result.detected_features}")
    # We might not have 'score' in the result yet, but we will add it or it will be part of reasoning
    print(f"Complexity: {result.complexity}")
    print(f"Provider: {result.recommended_provider}")
    print(f"Reasoning: {result.reasoning}")
    
    if expected_complexity:
        assert result.complexity == expected_complexity, f"Expected complexity {expected_complexity}, got {result.complexity}"
        print("✅ Complexity check passed")
    
    if expected_provider:
        assert result.recommended_provider == expected_provider, f"Expected provider {expected_provider}, got {result.recommended_provider}"
        print("✅ Provider check passed")

if __name__ == "__main__":
    # Case 1: Simple greeting
    test_case(
        "Simple Greeting", 
        "Hola, ¿cómo estás?", 
        expected_complexity="simple",
        expected_provider="google" # Updated to Cost-Optimized Default
    )

    # Case 2: Refactor React (User Example)
    # "Refactoriza este código React de 800 tokens..."
    # We simulate 800 tokens by repeating words if necessary, or just rely on the features if the tokenizer is mocked/real.
    # The real tokenizer counts words. Let's make a prompt that is ~800 tokens roughly? 
    # Or just trust the feature detection on a shorter string for now, but the user example relied on 800 tokens.
    # Let's write a reasonably long dummy prompt.
    long_code_prompt = "Refactoriza este código React. " + ("code " * 800) 
    test_case(
        "Refactor React (800 tokens)",
        long_code_prompt,
        expected_complexity="moderate", # 1.5 base * 1.5 refactor * 1.3 code = > 1.5
        expected_provider="anthropic" # Override for 'refactor'/'code'
    )

    # Case 3: Reasoning Override
    test_case(
        "Reasoning Override",
        "Explica paso a paso el porqué de la existencia.",
        expected_provider="deepseek"
    )

    # Case 4: Complex Architecture
    test_case(
        "Complex Architecture",
        "Diseña una arquitectura de microservicios para un banco.",
        expected_complexity="simple", # Score is low due to low tokens (0.5 * 1.5 = 0.75)
        expected_provider="anthropic" # Override Works
    )
