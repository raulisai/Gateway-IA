import json
import logging
import threading
import time
from typing import List, Optional, Dict, Any
from pathlib import Path
from pydantic import ValidationError

from app.schemas.registry import ModelDefinition

logger = logging.getLogger(__name__)

class ModelRegistry:
    def __init__(self, data_path: str = "data/models.json", auto_reload: bool = True):
        self.data_path = Path(data_path)
        self.models: Dict[str, ModelDefinition] = {}
        self.last_load_time = 0.0
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._watcher_thread = None

        self.load_models()

        if auto_reload:
            self._start_watcher()

    def load_models(self) -> None:
        """Loads models from the JSON file."""
        if not self.data_path.exists():
            logger.warning(f"Models file not found at {self.data_path}")
            return

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            loaded_models = {}
            for item in raw_data:
                try:
                    model = ModelDefinition(**item)
                    if model.is_active:
                        loaded_models[model.id] = model
                except ValidationError as e:
                    logger.error(f"Validation error for model item: {item}. Error: {e}")
            
            with self._lock:
                self.models = loaded_models
                self.last_load_time = self.data_path.stat().st_mtime
                logger.info(f"Loaded {len(self.models)} models from {self.data_path}")

        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON from {self.data_path}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error loading models: {e}")

    def get_model(self, model_id: str) -> Optional[ModelDefinition]:
        """Retrieve a specific model by ID."""
        with self._lock:
            return self.models.get(model_id)

    def list_models(self, provider: Optional[str] = None) -> List[ModelDefinition]:
        """List all models, optionally filtered by provider."""
        with self._lock:
            if provider:
                return [m for m in self.models.values() if m.provider == provider]
            return list(self.models.values())

    def _start_watcher(self):
        """Starts a background thread to watch for file changes."""
        self._watcher_thread = threading.Thread(target=self._watch_file, daemon=True)
        self._watcher_thread.start()

    def _watch_file(self):
        """Polls the file for changes every few seconds."""
        while not self._stop_event.is_set():
            time.sleep(5)  # Poll every 5 seconds
            try:
                if self.data_path.exists():
                    current_mtime = self.data_path.stat().st_mtime
                    if current_mtime > self.last_load_time:
                        logger.info("Detected change in models.json, reloading...")
                        self.load_models()
            except Exception as e:
                logger.error(f"Error in file watcher: {e}")

    def stop_watcher(self):
        self._stop_event.set()
        if self._watcher_thread:
            self._watcher_thread.join(timeout=1)

# Global registry instance
# We assume the backend is run from the root directory or backend directory.
# Adjust path as necessary based on CWD.
model_registry = ModelRegistry("data/models.json")
