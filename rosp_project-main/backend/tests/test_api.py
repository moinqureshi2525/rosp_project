import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import init_db

# Initialize database explicitly for testing environment
init_db()

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "SmartCanteen AI"}


def test_get_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4


def test_get_food_items():
    response = client.get("/api/items")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 12


def test_get_dashboard_analytics():
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "todays_order_count" in data
    assert "todays_revenue" in data
    assert "total_food_items" in data
    assert data["total_food_items"] == 12


def test_get_demand_predictions():
    response = client.get("/api/predictions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_create_student_order():
    # Fetch an item ID
    items_resp = client.get("/api/items")
    item_id = items_resp.json()[0]["id"]
    
    order_payload = {
        "user_id": "u1000000-0000-0000-0000-000000000001",
        "items": [
            {"food_item_id": item_id, "quantity": 2}
        ]
    }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert data["total_amount"] > 0


def test_ai_chat_assistant():
    payload = {"message": "What should we prepare tomorrow?"}
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0


def test_generate_predictions_endpoint():
    response = client.post("/api/predictions/generate")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 12
