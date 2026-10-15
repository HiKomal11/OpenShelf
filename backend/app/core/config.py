import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = Path(
    os.getenv("STORAGE_DIR", str(BASE_DIR / "storage"))
)
DOCUMENT_STORAGE_DIR = STORAGE_DIR / "documents"

class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_POOLED: str = ""

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SESSION_SECRET_KEY: str = ""
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = (
        "http://127.0.0.1:8000/api/v1/auth/google/callback"
    )

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    FRONTEND_URL: str = "http://localhost:3000"
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 30

    MAX_PDF_SIZE_MB: int = 50

        # Object storage
    STORAGE_BACKEND: str = "local"

    # Vercel Blob
    BLOB_READ_WRITE_TOKEN: str = ""

    # Cloudflare R2 (legacy compatibility during migration)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT_URL: str = ""

    BASE_DIR: Path = BASE_DIR
    STORAGE_DIR: Path = STORAGE_DIR
    DOCUMENT_STORAGE_DIR: Path = DOCUMENT_STORAGE_DIR

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()