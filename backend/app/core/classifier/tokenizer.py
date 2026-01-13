import tiktoken
import logging
from typing import List, Dict, Union

logger = logging.getLogger(__name__)

class TokenCounter:
    def __init__(self, default_encoding: str = "cl100k_base"):
        self.default_encoding = default_encoding
        try:
            self.encoding = tiktoken.get_encoding(default_encoding)
        except Exception as e:
            logger.error(f"Error loading encoding {default_encoding}: {e}")
            # Fallback for robustness
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str, model: str = None) -> int:
        """
        Count tokens in a text string.
        Optionally accepts a model name to automatically select the correct encoding.
        """
        if not text:
            return 0
            
        encoding = self.encoding
        if model:
            try:
                encoding = tiktoken.encoding_for_model(model)
            except KeyError:
                logger.warning(f"Could not find encoding for model {model}, using default {self.default_encoding}")
        
        return len(encoding.encode(text))

    def count_messages(self, messages: List[Dict[str, str]], model: str = "gpt-4o") -> int:
        """
        Count tokens for a list of messages (Chat format).
        Logic adapted from OpenAI's cookbook for gpt-3.5/4.
        """
        encoding = self.encoding
        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning(f"Could not find encoding for model {model}, using default")

        tokens_per_message = 3
        tokens_per_name = 1
        
        # Adjust per model logic if needed, but for now 3/1 is a good general approximation for current models
        
        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(encoding.encode(str(value)))
                if key == "name":
                    num_tokens += tokens_per_name
        
        num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
        return num_tokens

# Global instance
token_counter = TokenCounter()
