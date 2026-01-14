import pytest
import logging
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from app.core.middleware import RequestLoggingMiddleware
from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)
from fastapi.exceptions import RequestValidationError

# Setup a minimal app for testing middleware and errors
app = FastAPI()
app.add_middleware(RequestLoggingMiddleware)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

class Item(BaseModel):
    name: str = Field(..., min_length=3)

@app.get("/success")
async def success():
    return {"message": "ok"}

@app.get("/error/http")
async def http_error():
    raise HTTPException(status_code=404, detail="Item not found")

@app.post("/error/validation")
async def validation_error(item: Item):
    return item

@app.get("/error/general")
async def general_error():
    raise Exception("Boom")

client = TestClient(app, raise_server_exceptions=False)

def test_request_logging(caplog):
    caplog.set_level(logging.INFO)
    response = client.get("/success")
    assert response.status_code == 200
    
    # Check logs
    assert "REQ_START: GET /success" in caplog.text
    assert "REQ_END: GET /success" in caplog.text
    assert "Duration:" in caplog.text

def test_http_exception_handler():
    response = client.get("/error/http")
    assert response.status_code == 404
    data = response.json()
    # Updated: Error handler now returns standard FastAPI format
    assert "detail" in data
    assert data["detail"] == "Item not found"

def test_validation_exception_handler():
    # Send invalid data (name too short)
    response = client.post("/error/validation", json={"name": "a"})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"
    assert "details" in data["error"]
    # Pydantic v2 error message format check
    assert any("name" in d for d in data["error"]["details"])

def test_general_exception_handler():
    response = client.get("/error/general")
    assert response.status_code == 500
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "internal_error"
    assert data["error"]["message"] == "An unexpected error occurred"
