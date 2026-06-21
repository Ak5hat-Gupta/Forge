import io
import zipfile


SAMPLE_CSV = """Name,Age,Active
Alice,30,true
Bob,25,false
Charlie,35,true"""


def _upload(auth_client):
    return auth_client.post(
        "/api/v1/spreadsheets/upload",
        files={"file": ("people.csv", io.BytesIO(SAMPLE_CSV.encode()), "text/csv")},
    ).json()


def test_eject_preview(auth_client):
    sid = _upload(auth_client)["id"]
    r = auth_client.get(f"/api/v1/spreadsheets/{sid}/eject/preview")
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["total_files"] > 0
    paths = [f["path"] for f in data["files"]]
    assert "backend/main.py" in paths
    assert "web/src/app/page.tsx" in paths


def test_eject_zip(auth_client):
    sid = _upload(auth_client)["id"]
    r = auth_client.get(f"/api/v1/spreadsheets/{sid}/eject")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    names = zf.namelist()
    assert any(n.endswith("backend/main.py") for n in names)
    assert any(n.endswith("web/package.json") for n in names)


def test_eject_generated_python_valid(auth_client):
    sid = _upload(auth_client)["id"]
    r = auth_client.get(f"/api/v1/spreadsheets/{sid}/eject")
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    models_path = next(n for n in zf.namelist() if n.endswith("models.py"))
    code = zf.read(models_path).decode()
    compile(code, "models.py", "exec")  # raises SyntaxError if invalid
