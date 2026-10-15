
import re
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        requirements = [
            (r"[A-Z]", "at least one uppercase letter"),
            (r"[a-z]", "at least one lowercase letter"),
            (r"[0-9]", "at least one number"),
            (r"[^A-Za-z0-9]", "at least one special character"),
        ]

        missing = [
            description
            for pattern, description in requirements
            if re.search(pattern, password) is None
        ]

        if missing:
            raise ValueError(
                "Password must contain " + ", ".join(missing) + "."
            )

        return password


class GoogleExchangeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=512)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    roles: list[str]


class ResendVerificationRequest(BaseModel):
    email: EmailStr