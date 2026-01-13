import re
from typing import List, Dict, Union
from app.core.classifier.tokenizer import token_counter
from app.schemas.classifier import ClassificationResult

class RequestClassifier:
    # Thresholds
    SIMPLE_THRESHOLD = 500
    MODERATE_THRESHOLD = 3000
    COMPLEX_THRESHOLD = 15000
    
    # Feature Patterns (Regex)
    FEATURES = {
        "code": r"(def |function |class |import |const |let |var |=>|return )",
        "sql": r"(SELECT |INSERT |UPDATE |DELETE |FROM |WHERE |JOIN )",
        "json": r"(\{.*\}|\[.*\])",
        "refactor": r"(refactor|optimize|rewrite|clean up)",
        "reasoning": r"(explain|why|how|analyze|compare|evaluate)"
    }

    def analyze(self, prompt: Union[str, List[Dict[str, str]]]) -> ClassificationResult:
        """
        Analyze the request to determine complexity and recommended provider.
        Accepts either a raw string or a list of messages (chat format).
        """
        text_content = ""
        
        # 1. Calculate Tokens and extract text
        if isinstance(prompt, list):
            tokens = token_counter.count_messages(prompt)
            # Naive concatenation for feature analysis
            for msg in prompt:
                text_content += str(msg.get("content", "")) + "\n"
        else:
            tokens = token_counter.count_tokens(prompt)
            text_content = prompt

        # 2. Detect Features
        detected_features = []
        for feature, pattern in self.FEATURES.items():
            if re.search(pattern, text_content, re.IGNORECASE):
                detected_features.append(feature)

        # 3. Determine Complexity
        complexity = "simple"
        provider = "openai" # default to flash/mini equivalent
        reasoning = f"Request length is {tokens} tokens."

        # Heuristics
        # If we detect specific technical features, bump complexity immediately
        is_technical = any(f in detected_features for f in ["code", "sql", "refactor"])
        
        if tokens > self.COMPLEX_THRESHOLD:
            complexity = "expert"
            provider = "anthropic" # Claude or big context models
            reasoning += " High context usage requires expert model."
        elif tokens > self.MODERATE_THRESHOLD:
            complexity = "complex"
            provider = "anthropic" 
            reasoning += " Significant context length."
        elif is_technical:
            complexity = "complex"
            provider = "anthropic" # Claude is generally preferred for coding/technical
            reasoning += " Technical content detected (code/sql), upgrading complexity."
        elif tokens > self.SIMPLE_THRESHOLD:
            complexity = "moderate"
            provider = "openai" # gpt-4o
            reasoning += " Moderate length."
        else:
            complexity = "simple"
            provider = "openai" # gpt-4o-mini / gemini-flash
            reasoning += " Short and simple request."

        return ClassificationResult(
            complexity=complexity,
            tokens=tokens,
            detected_features=detected_features,
            recommended_provider=provider,
            reasoning=reasoning
        )

# Global instance
request_classifier = RequestClassifier()
