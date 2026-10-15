from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str | None = None
    error: str | None = None