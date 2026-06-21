from __future__ import annotations

import io
import json
import re
import zipfile
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.spreadsheet import Spreadsheet, SpreadsheetColumn
from app.models.row import Row

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
    keep_trailing_newline=True,
)


def _pascal(s: str) -> str:
    parts = re.split(r"[^a-zA-Z0-9]", s)
    return "".join(p.capitalize() for p in parts if p) or "Item"


def _singular(s: str) -> str:
    if s.endswith("ies"):
        return s[:-3] + "y"
    if s.endswith("ses") or s.endswith("xes"):
        return s[:-2]
    if s.endswith("s") and not s.endswith("ss"):
        return s[:-1]
    return s


def _coerce_value(value: Any, col_type: str) -> Any:
    if value is None or value == "":
        return None
    if col_type == "boolean":
        if isinstance(value, bool):
            return value
        return str(value).lower() in {"true", "yes", "1", "t", "y"}
    if col_type == "integer":
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    if col_type in ("float", "currency"):
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    return str(value)


def _build_context(spreadsheet: Spreadsheet, rows: list[Row]) -> dict[str, Any]:
    slug = re.sub(r"[^a-z0-9]+", "_", spreadsheet.name.lower()).strip("_") or "app"
    singular = _singular(slug)
    columns_data = [
        {
            "name": col.name,
            "slug": col.slug,
            "inferred_type": col.inferred_type,
            "nullable": col.nullable,
        }
        for col in sorted(spreadsheet.columns, key=lambda c: c.position)
    ]

    seed_rows = []
    for row in rows[:50]:
        coerced = {}
        for col in spreadsheet.columns:
            coerced[col.slug] = _coerce_value(row.data.get(col.slug), col.inferred_type)
        seed_rows.append(coerced)

    return {
        "app_name": spreadsheet.name,
        "slug": slug,
        "resource": slug,
        "class_name": _pascal(singular),
        "table_name": slug,
        "columns": columns_data,
        "seed_data": json.dumps(seed_rows, indent=4, default=str),
    }


def _render(template_path: str, context: dict[str, Any]) -> str:
    return _env.get_template(template_path).render(**context)


def _read_static(template_path: str) -> str:
    return (TEMPLATES_DIR / template_path).read_text()


def generate_zip(spreadsheet: Spreadsheet, rows: list[Row]) -> bytes:
    ctx = _build_context(spreadsheet, rows)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Backend files
        zf.writestr(f"{ctx['slug']}/backend/main.py", _render("backend/main.py.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/database.py", _render("backend/database.py.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/models.py", _render("backend/models.py.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/schemas.py", _render("backend/schemas.py.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/api.py", _render("backend/api.py.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/requirements.txt", _render("backend/requirements.txt.j2", ctx))
        zf.writestr(f"{ctx['slug']}/backend/seed.py", _render("backend/seed.py.j2", ctx))

        # Frontend files
        zf.writestr(f"{ctx['slug']}/web/package.json", _render("frontend/package.json.j2", ctx))
        zf.writestr(f"{ctx['slug']}/web/tsconfig.json", _read_static("frontend/tsconfig.json"))
        zf.writestr(f"{ctx['slug']}/web/tailwind.config.ts", _read_static("frontend/tailwind.config.ts"))
        zf.writestr(f"{ctx['slug']}/web/postcss.config.mjs", _read_static("frontend/postcss.config.mjs"))
        zf.writestr(f"{ctx['slug']}/web/next.config.mjs", _read_static("frontend/next.config.mjs"))
        zf.writestr(f"{ctx['slug']}/web/src/app/globals.css", _read_static("frontend/globals.css"))
        zf.writestr(f"{ctx['slug']}/web/src/app/layout.tsx", _render("frontend/layout.tsx.j2", ctx))
        zf.writestr(f"{ctx['slug']}/web/src/app/page.tsx", _render("frontend/page.tsx.j2", ctx))

        # Root README
        zf.writestr(f"{ctx['slug']}/README.md", _render("backend/README.md.j2", ctx))
        zf.writestr(f"{ctx['slug']}/.gitignore", "node_modules/\n.next/\n.venv/\n__pycache__/\n*.db\n.env\n")

    buf.seek(0)
    return buf.getvalue()


def preview_files(spreadsheet: Spreadsheet, rows: list[Row]) -> dict[str, str]:
    ctx = _build_context(spreadsheet, rows)
    return {
        "backend/main.py": _render("backend/main.py.j2", ctx),
        "backend/models.py": _render("backend/models.py.j2", ctx),
        "backend/schemas.py": _render("backend/schemas.py.j2", ctx),
        "backend/api.py": _render("backend/api.py.j2", ctx),
        "backend/database.py": _render("backend/database.py.j2", ctx),
        "backend/seed.py": _render("backend/seed.py.j2", ctx),
        "backend/requirements.txt": _render("backend/requirements.txt.j2", ctx),
        "web/src/app/page.tsx": _render("frontend/page.tsx.j2", ctx),
        "web/src/app/layout.tsx": _render("frontend/layout.tsx.j2", ctx),
        "web/package.json": _render("frontend/package.json.j2", ctx),
        "README.md": _render("backend/README.md.j2", ctx),
    }
