from fastapi import APIRouter

from app.api import auth, spreadsheets, rows, charts, eject, share

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(spreadsheets.router)
api_router.include_router(rows.router)
api_router.include_router(charts.router)
api_router.include_router(eject.router)
api_router.include_router(share.router)
