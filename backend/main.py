
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api import api_router
from app.core.config import settings


app = FastAPI(
    title="PDF Library API",
    description="Backend API for the PDF Library project",
    version="0.1.0",
)

if settings.is_production and not settings.SESSION_SECRET_KEY:
    raise RuntimeError(
        "SESSION_SECRET_KEY must be configured in production."
    )

if settings.is_production and not settings.CORS_ORIGINS.strip():
    raise RuntimeError(
        "CORS_ORIGINS must be configured in production."
    )

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY or settings.JWT_SECRET_KEY,
    same_site="lax",
    https_only=settings.is_production,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to PDF Library API",
        "status": "running",
    }