import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_db, get_current_user
from app.models.request_log import RequestLog
from app.models.user import User

def override_get_current_user():
    return User(id="test-user", email="test@example.com")

def test_analytics_overview():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Mocking DB response is hard with complex queries in integration tests without a real DB.
    # So we will rely on checking if status code isn't 500 when no data.
    
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "total_cost" in data

def test_analytics_cost_breakdown():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    response = client.get("/api/v1/analytics/cost-breakdown")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_analytics_requests():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    response = client.get("/api/v1/analytics/requests")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
