import re
import math
from typing import List, Dict, Union, Tuple
from app.core.classifier.tokenizer import token_counter
from app.schemas.classifier import ClassificationResult

class RequestClassifier:
    # --- SCORING CONFIGURATION ---
    
    # Base Scores by Token Thresholds (Buckets for stability)
    TOKEN_SCORES = [
        (100, 0.5),    # Very short
        (500, 1.0),    # Short (Simple)
        (1000, 1.2),   # Medium-Short
        (2000, 1.5),   # Medium (Transition to Moderate)
        (4000, 2.0),   # Long-ish
        (8000, 3.0),   # Long (Complex)
        (16000, 4.0),  # Very Long (Expert)
        (float('inf'), 5.0) # Massive
    ]

    # Feature Detectors and Multipliers
    # (Regex Pattern, Multiplier, Feature Name)
    FEATURE_MAP = [
        # Reducers (simplify complexity)
        (r"(hola|buenos days|tardes|noches|hi|hello|hey)\b", 0.7, "greeting"),
        (r"^(que es|what is|define|significado de)\b", 0.8, "simple_question"),
        
        # Neutrals (slight bump)
        (r"(\{.*\}|\[.*\]|json)", 1.1, "json"),
        (r"(api|endpoint|http|get|post|put|delete)", 1.2, "api"),
        
        # Boosters (increase complexity)
        (r"(first|second|then|step \d|primero|luego|paso \d|paso a paso)", 1.3, "multi_step"),
        (r"(```|def |function |class |import |const |let |var |=>|return )", 1.4, "code"),
        (r"(\+|\-|\*|\/|\=|\^|equation|formula|math|cálculo)", 1.4, "math"),
        (r"(explain|why|how|analyze|compare|evaluate|reasoning|pensar|razona|explica|por qué|analiza)", 1.4, "reasoning"),
        (r"(refactor|optimize|rewrite|clean up|optimizar|mejorar)", 1.5, "refactor"),
        (r"(architecture|microservices|distributed|system design|arquitectura)", 1.5, "architecture"),
    ]

    # Complexity Thresholds (Score -> Category)
    COMPLEXITY_MAP = [
        (1.5, "simple"),
        (3.0, "moderate"),
        (5.0, "complex"),
        (float('inf'), "expert")
    ]

    # Provider Overrides (Feature -> Provider)
    # Order matters: higher priority first
    OVERRIDES = [
        ("reasoning", "google"),
        ("math", "deepseek"),
        ("refactor", "anthropic"),
        ("architecture", "anthropic"),
        ("code", "anthropic"),
    ]

    # Default Providers by Complexity (Cost-Optimized)
    DEFAULT_PROVIDERS = {
        "simple": "google",   # Gemini Flash is extremely cheap/free
        "moderate": "deepseek", # DeepSeek V3 is cheaper & comparable to GPT-4o
        "complex": "anthropic", # Keep Claude for complex tasks where quality is paramount
        "expert": "google"    # Gemini Pro 1.5 has massive context at good price
    }

    def analyze(self, prompt: Union[str, List[Dict[str, str]]]) -> ClassificationResult:
        """
        Analyze the request using a score-based system:
        Score = Base(Tokens) * Product(Multipliers)
        """
        # 1. Extract Text and Count Tokens
        if isinstance(prompt, list):
            tokens = token_counter.count_messages(prompt)
            text_content = "\n".join([
                str(msg.get("content", "") if isinstance(msg, dict) else getattr(msg, "content", ""))
                for msg in prompt
            ])
        else:
            tokens = token_counter.count_tokens(prompt)
            text_content = prompt

        # 2. Calculate Scores
        base_score = self._calculate_base_score(tokens)
        detected_features, multiplier = self._detect_features(text_content)
        
        # Cap multiplier to prevent explosion (e.g. max 2.5x)
        multiplier = min(multiplier, 2.5)
        
        final_score = base_score * multiplier
        
        # 3. Determine Complexity
        complexity = self._score_to_complexity(final_score)
        
        # 4. Select Provider (Overrides > Defaults)
        provider, rule_applied = self._select_provider(complexity, detected_features)

        # 5. Reasoning String
        reasoning = (
            f"Tokens: {tokens} (Base Score: {base_score}). "
            f"Features: {detected_features} (Multiplier: x{multiplier:.2f}). "
            f"Final Score: {final_score:.2f} -> {complexity.upper()}. "
            f"Selected {provider} via {rule_applied}."
        )

        return ClassificationResult(
            complexity=complexity,
            tokens=tokens,
            detected_features=detected_features,
            recommended_provider=provider,
            reasoning=reasoning
        )

    def _calculate_base_score(self, tokens: int) -> float:
        """Determines base score from token count buckets."""
        for limit, score in self.TOKEN_SCORES:
            if tokens <= limit:
                return score
        return 5.0 # Fallback

    def _detect_features(self, text: str) -> Tuple[List[str], float]:
        """Scans text for features and calculates compound multiplier."""
        found = []
        total_multiplier = 1.0
        
        for pattern, weight, name in self.FEATURE_MAP:
            if re.search(pattern, text, re.IGNORECASE):
                found.append(name)
                total_multiplier *= weight
        
        return found, total_multiplier

    def _score_to_complexity(self, score: float) -> str:
        """Maps final score to complexity category."""
        for limit, category in self.COMPLEXITY_MAP:
            if score < limit:
                return category
        return "expert"

    def _select_provider(self, complexity: str, features: List[str]) -> Tuple[str, str]:
        """Applies overrides or falls back to default table."""
        # Check overrides
        for feature, provider in self.OVERRIDES:
            if feature in features:
                return provider, f"Override ({feature})"
        
        # Default
        return self.DEFAULT_PROVIDERS.get(complexity, "openai"), "Complexity Table"

# Global instance
request_classifier = RequestClassifier()
