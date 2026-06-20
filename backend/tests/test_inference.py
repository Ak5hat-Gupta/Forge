from app.services.inference import infer_column


def test_infer_integer():
    result = infer_column("Age", 0, ["25", "30", "35", "40", "28"])
    assert result.inferred_type == "integer"


def test_infer_float():
    result = infer_column("Score", 0, ["3.14", "2.71", "1.41", "9.81", "6.28"])
    assert result.inferred_type == "float"


def test_infer_boolean():
    result = infer_column("Active", 0, ["true", "false", "true", "true", "false"])
    assert result.inferred_type == "boolean"


def test_infer_email():
    result = infer_column("Email", 0, ["a@b.com", "c@d.org", "e@f.net", "g@h.io", "i@j.co"])
    assert result.inferred_type == "email"


def test_infer_url():
    result = infer_column("Website", 0, [
        "https://example.com", "https://test.org", "http://foo.bar",
        "https://a.io", "https://b.dev",
    ])
    assert result.inferred_type == "url"


def test_infer_string_fallback():
    result = infer_column("Notes", 0, ["hello world", "some text", "another note", "data", "misc"])
    assert result.inferred_type == "string"


def test_infer_nullable():
    result = infer_column("Name", 0, ["Alice", None, "Charlie", "", "Eve"])
    assert result.nullable is True


def test_infer_enum():
    vals = ["Active"] * 50 + ["Inactive"] * 50
    result = infer_column("Status", 0, vals)
    assert result.inferred_type == "enum"
    assert set(result.enum_values) == {"Active", "Inactive"}
