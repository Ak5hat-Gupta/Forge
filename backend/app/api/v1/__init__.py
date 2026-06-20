from fastapi import APIRouter

from app.api import auth, spreadsheets, rows, charts

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(spreadsheets.router)
api_router.include_router(rows.router)
api_router.include_router(charts.router)
