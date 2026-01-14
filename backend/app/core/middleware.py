import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        
        # Log Request Start
        logger.info(f"REQ_START: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Log Request End
            process_time = (time.time() - start_time) * 1000
            
            # Try to get user info if set by deps (this might not work here as middleware runs before deps fully in some cases, context var needed)
            # But normally we rely on just path/status for general logging. 
            # Dedicated usage logger handles detailed authenticated logs.
            
            logger.info(
                f"REQ_END: {request.method} {request.url.path} "
                f"Status: {response.status_code} "
                f"Duration: {process_time:.2f}ms"
            )
            
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"REQ_FAIL: {request.method} {request.url.path} "
                f"Duration: {process_time:.2f}ms "
                f"Error: {str(e)}"
            )
            raise e
