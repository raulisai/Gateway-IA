import json
import logging
import shutil
import time
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

from app.services.registry.scraper import (
    RegistryScraper, OpenAIScraper, AnthropicScraper, GoogleScraper, GrokScraper, DeepSeekScraper, GroqLpuScraper, ScrapedModel
)

logger = logging.getLogger(__name__)

MODELS_FILE_PATH = Path("data/models.json")

class RegistryManager:
    def __init__(self):
        self.models_file = MODELS_FILE_PATH
        self.scrapers: List[RegistryScraper] = [
            OpenAIScraper(),
            AnthropicScraper(),
            GoogleScraper(),
            GrokScraper(),
            DeepSeekScraper(),
            GroqLpuScraper(),
        ]

    def backup_registry(self) -> str:
        """Creates a backup of the current models.json file."""
        if not self.models_file.exists():
            logger.warning(f"{self.models_file} does not exist, skipping backup.")
            return ""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.models_file.with_suffix(f".json.bak.{timestamp}")
        try:
            shutil.copy2(self.models_file, backup_path)
            logger.info(f"Registry backed up to {backup_path}")
            return str(backup_path)
        except Exception as e:
            logger.error(f"Failed to backup registry: {e}")
            raise

    async def update_registry(self) -> Dict[str, Any]:
        """
        Orchestrates the scraping and updating process.
        Returns a changelog report.
        """
        self.backup_registry()
        
        # Load existing
        current_models = self._load_current_registry()
        current_map = {m['id']: m for m in current_models}
        
        changelog = {
            "added": [],
            "updated": [],
            "timestamp": datetime.now().isoformat()
        }
        
        new_registry_map = current_map.copy()

        # Run scrapers
        for scraper in self.scrapers:
            try:
                logger.info(f"Running scraper for {scraper.provider_name}...")
                scraped_models = await scraper.scrape()
                for scraped in scraped_models:
                    model_id = scraped.id
                    
                    if model_id not in new_registry_map:
                        # New model
                        new_model_dict = scraped.model_dump()
                        new_model_dict["provider"] = scraper.provider_name
                        new_model_dict["is_active"] = True
                        new_model_dict["original_model_id"] = model_id
                        # Assuming defaults for missing fields if any
                        new_registry_map[model_id] = new_model_dict
                        changelog["added"].append(model_id)
                    else:
                        # Check for updates (price changes)
                        existing = new_registry_map[model_id]
                        diff = []
                        if existing.get("cost_per_1k_input") != scraped.cost_per_1k_input:
                            diff.append(f"input_cost: {existing.get('cost_per_1k_input')} -> {scraped.cost_per_1k_input}")
                            existing["cost_per_1k_input"] = scraped.cost_per_1k_input
                        
                        if existing.get("cost_per_1k_output") != scraped.cost_per_1k_output:
                            diff.append(f"output_cost: {existing.get('cost_per_1k_output')} -> {scraped.cost_per_1k_output}")
                            existing["cost_per_1k_output"] = scraped.cost_per_1k_output
                            
                        if diff:
                            changelog["updated"].append({"id": model_id, "changes": diff})
                            
            except Exception as e:
                logger.error(f"Scraper {scraper.provider_name} failed: {e}")
                # Continue with other scrapers
        
        # Write updates if any
        if changelog["added"] or changelog["updated"]:
            self._save_registry(list(new_registry_map.values()))
            logger.info(f"Registry updated: {len(changelog['added'])} added, {len(changelog['updated'])} updated.")
        else:
            logger.info("No changes detected in registry.")

        return changelog

    def _load_current_registry(self) -> List[Dict]:
        if not self.models_file.exists():
            return []
        try:
            with open(self.models_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading registry: {e}")
            return []

    def _save_registry(self, data: List[Dict]):
        try:
            # Sort by provider then id for cleanliness
            data.sort(key=lambda x: (x.get('provider', ''), x.get('id', '')))
            with open(self.models_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Error saving registry: {e}")
            raise
