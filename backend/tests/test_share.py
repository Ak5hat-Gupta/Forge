import io


SAMPLE_CSV = """Product,Price
Widget,9.99
Gadget,19.99
Gizmo,29.99"""


def _upload(auth_client):
    return auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("products.csv", io.BytesIO(SAMPLE_CSV.encode()), "text/csv")},
    ).json()


def test_enable_share(auth_client):
    sid = _upload(auth_client)["id"]
    r = auth_client.post(f"/api/v1/spreadsheets/{sid}/share?enable=true")
    assert r.status_code == 200
    data = r.json()
    assert data["shared"] is True
    assert data["share_token"]


def test_public_access_no_auth(auth_client, client):
    sid = _upload(auth_client)["id"]
    token = auth_client.post(f"/api/v1/spreadsheets/{sid}/share?enable=true").json()["share_token"]

    # Use a fresh client with no auth header
    r = client.get(f"/api/v1/public/{token}/rows")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 3
    assert data["name"] == "products"
    assert len(data["columns"]) == 2


def test_disable_share(auth_client, client):
    sid = _upload(auth_client)["id"]
    token = auth_client.post(f"/api/v1/spreadsheets/{sid}/share?enable=true").json()["share_token"]
    auth_client.post(f"/api/v1/spreadsheets/{sid}/share?enable=false")
    r = client.get(f"/api/v1/public/{token}/rows")
    assert r.status_code == 404


def test_invalid_token(client):
    r = client.get("/api/v1/public/nonexistent/rows")
    assert r.status_code == 404
