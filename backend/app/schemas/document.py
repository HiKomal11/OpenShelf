from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    author: str | None = Field(None, max_length=255)
    language: str | None = Field(None, max_length=50)
    publication_date: date | None = None
    is_public: bool = False
    is_active: bool = True


class DocumentCreate(DocumentBase):
    category_ids: list[int] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    author: str | None = Field(None, max_length=255)
    language: str | None = Field(None, max_length=50)
    publication_date: date | None = None
    is_public: bool | None = None
    is_active: bool | None = None
    category_ids: list[int] | None = None


class DocumentCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(DocumentBase):
    id: UUID
    uploaded_by: UUID
    created_at: datetime
    updated_at: datetime
    categories: list[DocumentCategoryResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)


class PublicDocumentFileResponse(BaseModel):
    file_name: str
    file_size: int
    mime_type: str
    ocr_status: str | None = None


class PublicDocumentResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    author: str | None = None
    language: str | None = None
    publication_date: date | None = None

    categories: list[DocumentCategoryResponse] = Field(
        default_factory=list
    )

    page_count: int | None = None
    file: PublicDocumentFileResponse | None = None

    model_config = ConfigDict(from_attributes=True)