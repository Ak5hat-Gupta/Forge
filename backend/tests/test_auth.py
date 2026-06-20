def test_register(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "new@forge.app",
        "password": "password123",
        "full_name": "New User",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@forge.app"


def test_register_duplicate(client):
    client.post("/api/v1/auth/register", json={
        "email": "dup@forge.app", "password": "password123",
    })
    r = client.post("/api/v1/auth/register", json={
        "email": "dup@forge.app", "password": "password123",
    })
    assert r.status_code == 400


def test_login(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@forge.app", "password": "password123",
    })
    r = client.post("/api/v1/auth/login", data={
        "username": "login@forge.app", "password": "password123",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_me(auth_client):
    r = auth_client.get("/api/v1/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@forge.app"
