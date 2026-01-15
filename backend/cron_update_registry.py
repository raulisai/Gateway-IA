import asyncio
import logging
import sys
from pathlib import Path

# Add the project root to python path so we can import app modules
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.registry.manager import RegistryManager
from app.core.logging_config import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting scheduled registry update...")
    manager = RegistryManager()
    try:
        changelog = await manager.update_registry()
        logger.info(f"Registry update completed. Changelog: {changelog}")
    except Exception as e:
        logger.error(f"Registry update failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
