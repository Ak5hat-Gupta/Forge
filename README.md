# Forge

**Turn any spreadsheet into a full web app — instantly.**

Upload a CSV or Excel file and Forge generates a complete application with authentication, CRUD operations, search, filters, auto-generated charts, and a REST API.

## Features

- **Smart Schema Inference** — Automatically detects column types (boolean, integer, float, currency, date, email, URL, enum, string) with 80% confidence threshold
- **Dynamic CRUD** — Full create, read, update, delete with pagination, sorting, and full-text search across JSONB data
- **Auto-Generated Charts** — Rule-based chart recommendations: line charts for time series, bar charts for categorical data, donut charts for enums, KPI cards for numeric summaries
- **Type-Aware Forms** — Dynamic form generation that maps each column type to the right input widget
- **CSV/Excel Export** — One-click data export
- **Auth & Multi-tenancy** — JWT-based authentication with per-user data isolation
- **REST API** — Full OpenAPI-documented API at `/docs`

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 · Tailwind CSS · Zustand · React Query · Recharts |
| Backend | FastAPI · SQLAlchemy 2 · Pydantic v2 · JWT Auth |
| Database | PostgreSQL (JSONB) · SQLite (dev) |
| Cache | Redis · In-process fallback |
| Deploy | Vercel · Render · Neon · Upstash |

## Quick Start

```bash
# Clone
git clone https://github.com/Ak5hat-Gupta/Forge.git
cd Forge

# Docker (recommended)
docker compose up --build

# Or manual setup
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ../web && npm install

# Run
make api    # Backend on :8000
make web    # Frontend on :3000
make seed   # Create demo user
```

**Demo credentials:** `demo@forge.app` / `demo12345`

## How It Works

1. **Upload** — Drop a CSV/Excel file
2. **Infer** — Two-pass algorithm samples rows, classifies 10 types at 80% confidence
3. **Store** — Data saved as JSONB rows with GIN index for fast queries
4. **Render** — Auto-generated table, forms, and charts based on schema

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Sign in |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/spreadsheets` | List spreadsheets |
| POST | `/api/v1/spreadsheets/upload` | Upload CSV/Excel |
| GET | `/api/v1/spreadsheets/{id}` | Get spreadsheet + schema |
| DELETE | `/api/v1/spreadsheets/{id}` | Delete spreadsheet |
| GET | `/api/v1/spreadsheets/{id}/rows` | Query rows (paginated, filtered, sorted) |
| POST | `/api/v1/spreadsheets/{id}/rows` | Create row |
| PUT | `/api/v1/spreadsheets/{id}/rows/{row_id}` | Update row |
| DELETE | `/api/v1/spreadsheets/{id}/rows/{row_id}` | Delete row |
| GET | `/api/v1/spreadsheets/{id}/charts/recommend` | Get chart recommendations |
| GET | `/api/v1/spreadsheets/{id}/charts/data` | Get chart data |

## Project Structure

```
Forge/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   ├── core/          # Config, auth, database, cache, middleware
│   │   ├── models/        # SQLAlchemy models
│   │   ├── repositories/  # Data access layer
│   │   ├── schemas/       # Pydantic request/response models
│   │   └── services/      # Business logic (inference, ingestion, charts)
│   └── tests/
├── web/
│   └── src/
│       ├── app/           # Next.js pages (App Router)
│       ├── components/    # React components
│       ├── lib/           # API client, types, utilities
│       └── store/         # Zustand state management
├── docker-compose.yml
├── render.yaml
└── Makefile
```

## License

MIT — Akshat Gupta
