def test_demo_creates_isolated_sandbox(client):
    r = client.post("/api/v1/auth/demo")
    assert r.status_code == 201
    data = r.json()
    assert data["access_token"]
    assert data["user"]["email"].startswith("guest-")
    assert data["user"]["email"].endswith("@demo.forge.app")


def test_demo_is_seeded_with_sample_data(client):
    token = client.post("/api/v1/auth/demo").json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    sheets = client.get("/api/v1/spreadsheets").json()
    assert len(sheets) == 1
    assert sheets[0]["name"] == "Employee Directory"
    assert sheets[0]["row_count"] == 30

    rows = client.get(f"/api/v1/spreadsheets/{sheets[0]['id']}/rows").json()
    assert rows["total"] == 30


def test_each_demo_visitor_is_isolated(client):
    # First visitor uploads is not visible to the second visitor.
    r1 = client.post("/api/v1/auth/demo").json()
    r2 = client.post("/api/v1/auth/demo").json()
    assert r1["user"]["email"] != r2["user"]["email"]

    client.headers["Authorization"] = f"Bearer {r1['access_token']}"
    sid = client.get("/api/v1/spreadsheets").json()[0]["id"]

    # The second visitor cannot see the first visitor's spreadsheet.
    client.headers["Authorization"] = f"Bearer {r2['access_token']}"
    assert client.get(f"/api/v1/spreadsheets/{sid}").status_code == 404
