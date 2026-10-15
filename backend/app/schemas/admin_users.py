from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str | None
    is_active: bool
    roles: list[str]


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminUserRolesUpdate(BaseModel):
    roles: list[str]