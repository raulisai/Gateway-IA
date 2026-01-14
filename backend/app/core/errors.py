from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle standard HTTP exceptions.
    """
    logger.warning(f"HTTP error {exc.status_code} at {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "http_error", "message": str(exc.detail)}},
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors.
    """
    logger.warning(f"Validation error at {request.url}: {exc.errors()}")
    # Simplify error structure
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"]) if "loc" in error else "unknown"
        msg = error["msg"]
        errors.append(f"{field}: {msg}")
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "validation_error",
                "message": "Input validation failed",
                "details": errors
            }
        },
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Handle Database errors.
    """
    logger.error(f"Database error at {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "database_error", "message": "Internal database error"}},
    )

async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected errors.
    """
    logger.exception(f"Unexpected error at {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "internal_error", "message": "An unexpected error occurred"}},
    )
