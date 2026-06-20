from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import __version__
from app.api.v1 import api_router
from app.core.cache import get_cache
from app.core.config import settings
from app.core.database import engine, init_db
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RateLimitMiddleware, RequestContextMiddleware

log = get_logger("forge.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    init_db()
    try:
        from app.seed import main as seed_main
        seed_main()
    except Exception as exc:
        log.warning("seed skipped", extra={"error": str(exc)})
    log.info(
        "forge started",
        extra={
            "environment": settings.environment,
            "cache_backend": get_cache().backend,
        },
    )
    yield
    log.info("forge shutting down")


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description=settings.app_description,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id", "x-response-time-ms"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestContextMiddleware)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["meta"])
def health() -> dict:
    db_ok = True
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    cache = get_cache()
    return {
        "status": "ok" if db_ok else "degraded",
        "version": __version__,
        "environment": settings.environment,
        "dependencies": {
            "database": "ok" if db_ok else "down",
            "cache": f"ok ({cache.backend})" if cache.healthy() else "down",
        },
    }


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "description": settings.app_description,
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
        "api": settings.api_v1_prefix,
    }
