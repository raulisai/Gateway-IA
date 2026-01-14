import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)

def setup_logging():
    """
    Configure logging with console and rotating file handlers.
    """
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Rotating File Handler (10MB per file, max 5 files)
    file_handler = RotatingFileHandler(
        LOGS_DIR / "access.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Specific adjustments
    logging.getLogger("uvicorn.access").handlers = [] # Disable default uvicorn access logger to avoid duplicates if we middleware log
