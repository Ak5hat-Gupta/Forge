import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["LOG_JSON"] = "false"

import pytest
from fastapi.testclient import TestClient
from app.core.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_client(client):
    client.post("/api/v1/auth/register", json={
        "email": "test@forge.app",
        "password": "testpass123",
        "full_name": "Test User",
    })
    r = client.post("/api/v1/auth/login", data={"username": "test@forge.app", "password": "testpass123"})
    token = r.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
