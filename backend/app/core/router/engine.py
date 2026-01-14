import logging
from typing import List, Optional

from app.core.registry import model_registry
from app.schemas.registry import ModelDefinition
from app.schemas.router import RoutingRequirements, RoutingStrategy, RoutingResult

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
        candidates = self._filter_context_window(candidates, requirements)
        candidates = self._filter_features(candidates, requirements)
        candidates = self._filter_provider_preference(candidates, requirements)
        candidates = self._filter_available_providers(candidates, available_providers)
        
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

        return RoutingResult(
            selected_model_id=selected.id,
            fallback_models=fallbacks,
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
            
            # Base Cost Score (Inverse of cost)
            # Normalize: assume max cost is around $0.03 (gpt-4)
            # cost_score = 100 * (1 - (model_cost / max_ref_cost))
            total_cost_per_k = model.cost_per_1k_input + model.cost_per_1k_output
            cost_score = max(0, 100 * (1 - (total_cost_per_k / 0.04))) # 0.04 as harsh upper bound reference
            
            # Speed Score (Heuristic)
            # Flash/Mini models = 90, Turbo/Sonnet = 70, Opus/GPT4 = 50
            speed_score = 50
            if "flash" in model.id or "mini" in model.id:
                speed_score = 90
            elif "3-5" in model.id or "turbo" in model.id:
                speed_score = 70
            
            # Quality Score (Heuristic)
            # GPT-4o/Sonnet = 95, Mini/Flash = 60
            quality_score = 60
            if "gpt-4o" in model.id and "mini" not in model.id:
                quality_score = 95
            elif "claude-3-5" in model.id:
                quality_score = 95
            elif "gemini-1.5-pro" in model.id:
                quality_score = 90
            
            # Weighted Sum based on Strategy
            if strategy == RoutingStrategy.COST:
                score = (cost_score * 0.8) + (quality_score * 0.1) + (speed_score * 0.1)
            elif strategy == RoutingStrategy.SPEED:
                score = (speed_score * 0.8) + (cost_score * 0.1) + (quality_score * 0.1)
            elif strategy == RoutingStrategy.QUALITY:
                score = (quality_score * 0.8) + (speed_score * 0.1) + (cost_score * 0.1)
            else: # BALANCED
                score = (quality_score * 0.4) + (cost_score * 0.4) + (speed_score * 0.2)
                
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
