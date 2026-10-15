from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_role
from app.db.session import get_db
from app.models.category import Category
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)

router = APIRouter(
    prefix="/admin/documents",
    tags=["Admin Documents"],
)


def get_document_with_categories(
    db: Session,
    document_id: UUID,
) -> Document | None:
    return db.scalar(
        select(Document)
        .options(selectinload(Document.categories))
        .where(Document.id == document_id)
    )


def validate_category_ids(
    db: Session,
    category_ids: list[int],
) -> list[Category]:
    if not category_ids:
        return []

    categories = db.scalars(
        select(Category).where(Category.id.in_(category_ids))
    ).all()

    found_ids = {category.id for category in categories}
    missing_ids = set(category_ids) - found_ids

    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category IDs not found: {sorted(missing_ids)}",
        )

    return categories


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    documents = db.scalars(
        select(Document)
        .options(selectinload(Document.categories))
        .order_by(Document.created_at.desc())
    ).all()

    return documents


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    categories = validate_category_ids(
        db,
        document_data.category_ids,
    )

    document = Document(
        title=document_data.title,
        description=document_data.description,
        author=document_data.author,
        language=document_data.language,
        publication_date=document_data.publication_date,
        is_public=document_data.is_public,
        is_active=document_data.is_active,
        uploaded_by=current_user.id,
    )

    document.categories = categories

    db.add(document)
    db.commit()
    db.refresh(document)

    return get_document_with_categories(
        db,
        document.id,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    document = get_document_with_categories(
        db,
        document_id,
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return document


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    document_id: UUID,
    document_data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    document = get_document_with_categories(
        db,
        document_id,
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    update_data = document_data.model_dump(
        exclude_unset=True,
        exclude={"category_ids"},
    )

    for field, value in update_data.items():
        setattr(document, field, value)

    if document_data.category_ids is not None:
        document.categories = validate_category_ids(
            db,
            document_data.category_ids,
        )

    db.commit()
    db.refresh(document)

    return get_document_with_categories(
        db,
        document.id,
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    document = db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    db.delete(document)
    db.commit()