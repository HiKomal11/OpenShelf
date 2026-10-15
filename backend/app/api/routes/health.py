from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.health import DatabaseHealthResponse, HealthResponse


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "service": "pdf-library-api",
    }


@router.get("/db", response_model=DatabaseHealthResponse)
def database_health_check(
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("SELECT current_database()")
        )
        database_name = result.scalar_one()

        return {
            "status": "healthy",
            "database": database_name,
        }

    except Exception as exc:
        return {
            "status": "unhealthy",
            "error": str(exc),
        }