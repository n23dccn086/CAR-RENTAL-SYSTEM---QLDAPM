import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_chat():
    response = client.post("/ai/chat", json={
        "message": "Xin chào"
    })
    assert response.status_code == 200
    assert "reply" in response.json()