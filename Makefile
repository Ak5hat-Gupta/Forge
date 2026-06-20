.PHONY: dev test api web seed

dev:
	docker compose up --build

api:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

web:
	cd web && npm run dev

seed:
	cd backend && source .venv/bin/activate && python -m app.seed

test:
	cd backend && source .venv/bin/activate && python -m pytest tests/ -v

install:
	cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	cd web && npm install
