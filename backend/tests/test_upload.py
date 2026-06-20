import io


def _csv_bytes(content: str) -> io.BytesIO:
    return io.BytesIO(content.encode("utf-8"))


SAMPLE_CSV = """Name,Age,Email,Active,Salary
Alice,30,alice@example.com,true,75000
Bob,25,bob@example.com,false,60000
Charlie,35,charlie@example.com,true,90000
Diana,28,diana@example.com,true,80000
Eve,32,eve@example.com,false,70000"""


def test_upload_csv(auth_client):
    r = auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("test.csv", _csv_bytes(SAMPLE_CSV), "text/csv")},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "test"
    assert data["row_count"] == 5
    assert data["status"] == "ready"
    assert len(data["columns"]) == 5


def test_upload_infers_types(auth_client):
    r = auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("test.csv", _csv_bytes(SAMPLE_CSV), "text/csv")},
    )
    cols = {c["slug"]: c["inferred_type"] for c in r.json()["columns"]}
    assert cols["name"] == "string"
    assert cols["age"] == "integer"
    assert cols["email"] == "email"
    assert cols["active"] == "boolean"
    assert cols["salary"] == "integer"


def test_list_spreadsheets(auth_client):
    auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("test.csv", _csv_bytes(SAMPLE_CSV), "text/csv")},
    )
    r = auth_client.get("/api/v1/spreadsheets")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_delete_spreadsheet(auth_client):
    r = auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("test.csv", _csv_bytes(SAMPLE_CSV), "text/csv")},
    )
    sid = r.json()["id"]
    r = auth_client.delete(f"/api/v1/spreadsheets/{sid}")
    assert r.status_code == 204
