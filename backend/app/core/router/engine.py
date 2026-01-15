import logging
from typing import List, Optional

from app.core.registry import model_registry
from app.schemas.registry import ModelDefinition
from app.schemas.router import RoutingRequirements, RoutingStrategy, RoutingResult, ProposedModel

logger = logging.getLogger(__name__)

class RoutingEngine:
    def select_model(
        self, 
        requirements: RoutingRequirements, 
        strategy: RoutingStrategy = RoutingStrategy.BALANCED,
        available_providers: Optional[List[str]] = None
    ) -> RoutingResult:
        """
        Selects the best model based on requirements and strategy.
        """
        # 1. Get all candidates
        candidates = model_registry.list_models()
        
        # 2. Filtering Phase
        candidates = self._filter_active(candidates)
        candidates = self._filter_available_providers(candidates, available_providers)
        candidates = self._filter_context_window(candidates, requirements)
        candidates = self._filter_features(candidates, requirements)
        candidates = self._filter_provider_preference(candidates, requirements)
        
        if not candidates:
            # Emergency fallback or error
            # If explicit provider preference failed, try again without it?
            # For now, strict fail.
            raise ValueError("No models available that match requirements.")

        # 3. Scoring/Selection Phase
        scored_candidates = self._score_models(candidates, strategy)
        
        # Sort by score descending
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        selected = scored_candidates[0]["model"]
        fallbacks = [item["model"].id for item in scored_candidates[1:]]
        
        proposed = [
            ProposedModel(
                id=item["model"].id,
                name=item["model"].name,
                provider=item["model"].provider,
                score=item["score"]
            )
            for item in scored_candidates[:5] # Return top 5
        ]

        return RoutingResult(
            selected_model_id=selected.id,
            fallback_models=fallbacks,
            proposed_models=proposed,
            reasoning=f"Selected {selected.id} with score {scored_candidates[0]['score']:.2f}. Strategy: {strategy}",
            strategy_used=strategy
        )

    def _score_models(
        self, models: List[ModelDefinition], strategy: RoutingStrategy
    ) -> List[dict]:
        """Assign a score (0-100) to each model based on the strategy."""
        results = []
        for model in models:
            score = 0.0
            
            # 1. Base Cost Score (Inverse of cost)
            # Reference max cost around $5.00/1M input (Claude, GPT-4)
            # cost_score = 100 * (1 - (model_cost / max_ref_cost))
            total_input_cost = model.cost_per_1k_input * 1000 # Convert to per 1M
            # Cap cost penalty
            cost_score = max(0, 100 * (1 - (total_input_cost / 10.0))) 
            
            # 2. Speed Score (Heuristic based on Provider/Model Family)
            speed_score = 50
            mid = model.id.lower()
            
            # Groq LPU is ultra-fast
            if model.provider == "groq":
                speed_score = 98 # Almost instant
            elif "flash" in mid: # Gemini Flash, DeepSeek, GPT-4o-mini
                speed_score = 90
            elif "mini" in mid or "haiku" in mid:
                speed_score = 85
            elif "turbo" in mid or "sonnet" in mid:
                speed_score = 70
            elif "opus" in mid or "gpt-4" in mid: # Heavier models
                speed_score = 50
            
            # 3. Quality Score (Heuristic based on Leaderboards/Desc)
            quality_score = 60
            
            # Frontier Class
            if any(x in mid for x in ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro", "opus-3"]):
                quality_score = 95
                
            # Strong Open Source / Efficient Frontier
            elif any(x in mid for x in ["llama-3.1-70b", "llama-3.3-70b", "deepseek-chat", "deepseek-v3"]):
                quality_score = 92
                
            # Mid-Range / Efficient
            elif any(x in mid for x in ["gpt-4o-mini", "gemini-1.5-flash", "claude-3-haiku", "llama-3.1-8b"]):
                quality_score = 80
                
            # Specialized
            elif "deepseek-reasoner" in mid or "o1" in mid or "reasoning" in mid:
                quality_score = 96 # Reasoning specialists
            
            # Weighted Sum based on Strategy
            if strategy == RoutingStrategy.COST:
                score = (cost_score * 0.7) + (quality_score * 0.2) + (speed_score * 0.1)
            elif strategy == RoutingStrategy.SPEED:
                score = (speed_score * 0.8) + (quality_score * 0.1) + (cost_score * 0.1)
            elif strategy == RoutingStrategy.QUALITY:
                score = (quality_score * 0.7) + (speed_score * 0.15) + (cost_score * 0.15)
            else: # BALANCED
                score = (quality_score * 0.4) + (cost_score * 0.3) + (speed_score * 0.3)
                
            results.append({"model": model, "score": score})
            
        return results

    def _filter_active(self, models: List[ModelDefinition]) -> List[ModelDefinition]:
        return [m for m in models if m.is_active]

    def _filter_context_window(
        self, models: List[ModelDefinition], requirements: RoutingRequirements
    ) -> List[ModelDefinition]:
        """Filter out models that cannot handle the total context (input + output)."""
        required_context = requirements.input_tokens + (requirements.max_output_tokens or 1024)
        return [m for m in models if m.context_window >= required_context]

    def _filter_features(
        self, models: List[ModelDefinition], requirements: RoutingRequirements
    ) -> List[ModelDefinition]:
        """Filter by required capabilities."""
        # This assumes ModelDefinition will eventually have a 'capabilities' field.
        # For now, we pass everything as models.json doesn't strictly enforce features yet 
        # except implicitly by provider.
        return models

    def _filter_provider_preference(
        self, models: List[ModelDefinition], requirements: RoutingRequirements
    ) -> List[ModelDefinition]:
        if not requirements.provider_preference:
            return models
        filtered = [m for m in models if m.provider == requirements.provider_preference]
        if not filtered:
            logger.warning(
                f"Preferred provider {requirements.provider_preference} yielded no results. Ignoring preference."
            )
            return models
        return filtered

    def _filter_available_providers(
        self, models: List[ModelDefinition], available_providers: Optional[List[str]]
    ) -> List[ModelDefinition]:
        if available_providers is None:
            return models
        return [m for m in models if m.provider in available_providers]

# Global instance
routing_engine = RoutingEngine()
