from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str
    message: str
    document_id: UUID | None
    category_id: int | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None