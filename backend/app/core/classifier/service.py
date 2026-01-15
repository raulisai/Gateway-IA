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
                content = msg.get("content", "") if isinstance(msg, dict) else getattr(msg, "content", "")
                text_content += str(content) + "\n"
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
        provider = "groq" # default to fast/cheap (Llama on Groq)
        reasoning = f"Request length is {tokens} tokens."

        # Heuristics
        # If we detect specific technical features, bump complexity immediately
        is_technical = any(f in detected_features for f in ["code", "sql", "refactor"])
        is_reasoning = "reasoning" in detected_features
        
        if tokens > self.COMPLEX_THRESHOLD:
            complexity = "expert"
            provider = "google" # Gemini 1.5/2.0 often has huge context and lower cost than Anthropic
            reasoning += " High context usage (>15k)."
        elif tokens > self.MODERATE_THRESHOLD:
            complexity = "complex"
            provider = "anthropic" # Claude 3.5 Sonnet is king here
            reasoning += " Significant context length."
        elif is_reasoning:
            complexity = "expert"
            provider = "deepseek" # DeepSeek-R1 / Reasoner
            reasoning += " Reasoning features detected (deep thinking required)."
        elif is_technical:
            complexity = "complex"
            provider = "anthropic" # Claude is generally preferred for coding
            reasoning += " Technical content detected (code/sql)."
        elif tokens > self.SIMPLE_THRESHOLD:
            complexity = "moderate"
            provider = "openai" # gpt-4o standard
            reasoning += " Moderate length."
        else:
            complexity = "simple"
            provider = "groq" # Llama-3.1-8b / 70b on Groq is unbeatable for speed
            reasoning += " Short request, prioritizing speed (Groq)."

        return ClassificationResult(
            complexity=complexity,
            tokens=tokens,
            detected_features=detected_features,
            recommended_provider=provider,
            reasoning=reasoning
        )

# Global instance
request_classifier = RequestClassifier()
