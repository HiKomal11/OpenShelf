
from datetime import datetime, timezone
from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user
from app.api.routes.public_documents import build_public_document_response
from app.db.session import get_db
from app.models.document import Document
from app.models.document_bookmark import DocumentBookmark
from app.models.document_like import DocumentLike
from app.models.document_view import DocumentView
from app.models.user import User


router = APIRouter(
    prefix="/documents",
    tags=["Document Interactions"],
)


user_router = APIRouter(
    prefix="/users/me",
    tags=["User Library"],
)


def get_public_document(
    document_id: UUID,
    db: Session,
) -> Document:
    document = db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.is_public.is_(True),
            Document.is_active.is_(True),
        )
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public document not found.",
        )

    return document


def get_like_count(
    document_id: UUID,
    db: Session,
) -> int:
    return (
        db.scalar(
            select(func.count(DocumentLike.id)).where(
                DocumentLike.document_id == document_id
            )
        )
        or 0
    )


@router.post("/{document_id}/like")
def like_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    existing_like = db.scalar(
        select(DocumentLike).where(
            DocumentLike.user_id == current_user.id,
            DocumentLike.document_id == document.id,
        )
    )

    if existing_like:
        return {
            "message": "Document already liked.",
            "liked": True,
            "like_count": get_like_count(document.id, db),
        }

    like = DocumentLike(
        user_id=current_user.id,
        document_id=document.id,
    )

    db.add(like)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_like = db.scalar(
            select(DocumentLike).where(
                DocumentLike.user_id == current_user.id,
                DocumentLike.document_id == document.id,
            )
        )

        if not existing_like:
            raise

    return {
        "message": "Document liked successfully.",
        "liked": True,
        "like_count": get_like_count(document.id, db),
    }


@router.delete("/{document_id}/like")
def unlike_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    existing_like = db.scalar(
        select(DocumentLike).where(
            DocumentLike.user_id == current_user.id,
            DocumentLike.document_id == document.id,
        )
    )

    if existing_like:
        db.delete(existing_like)
        db.commit()

    return {
        "message": "Document unliked successfully.",
        "liked": False,
        "like_count": get_like_count(document.id, db),
    }


@router.post("/{document_id}/bookmark")
def bookmark_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    existing_bookmark = db.scalar(
        select(DocumentBookmark).where(
            DocumentBookmark.user_id == current_user.id,
            DocumentBookmark.document_id == document.id,
        )
    )

    if existing_bookmark:
        return {
            "message": "Document already bookmarked.",
            "bookmarked": True,
        }

    bookmark = DocumentBookmark(
        user_id=current_user.id,
        document_id=document.id,
    )

    db.add(bookmark)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_bookmark = db.scalar(
            select(DocumentBookmark).where(
                DocumentBookmark.user_id == current_user.id,
                DocumentBookmark.document_id == document.id,
            )
        )

        if not existing_bookmark:
            raise

    return {
        "message": "Document bookmarked successfully.",
        "bookmarked": True,
    }


@router.delete("/{document_id}/bookmark")
def remove_bookmark(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    existing_bookmark = db.scalar(
        select(DocumentBookmark).where(
            DocumentBookmark.user_id == current_user.id,
            DocumentBookmark.document_id == document.id,
        )
    )

    if existing_bookmark:
        db.delete(existing_bookmark)
        db.commit()

    return {
        "message": "Document removed from bookmarks.",
        "bookmarked": False,
    }


@user_router.get("/bookmarks")
def list_user_bookmarks(
    page: int = Query(
        default=1,
        ge=1,
        description="Page number.",
    ),
    page_size: int = Query(
        default=12,
        ge=1,
        le=100,
        description="Number of documents per page.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [
        DocumentBookmark.user_id == current_user.id,
        Document.is_public.is_(True),
        Document.is_active.is_(True),
    ]

    total = (
        db.scalar(
            select(func.count(DocumentBookmark.id))
            .join(
                Document,
                Document.id == DocumentBookmark.document_id,
            )
            .where(*filters)
        )
        or 0
    )

    total_pages = ceil(total / page_size) if total else 0

    offset = (page - 1) * page_size

    query = (
        select(Document)
        .join(
            DocumentBookmark,
            DocumentBookmark.document_id == Document.id,
        )
        .options(
            selectinload(Document.categories),
            selectinload(Document.files),
            selectinload(Document.document_metadata),
        )
        .where(*filters)
        .order_by(DocumentBookmark.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    documents = db.scalars(query).unique().all()

    return {
        "items": [
            build_public_document_response(document)
            for document in documents
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }

@router.get("/{document_id}/interactions")
def get_document_interactions(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    liked = db.scalar(
        select(DocumentLike).where(
            DocumentLike.user_id == current_user.id,
            DocumentLike.document_id == document.id,
        )
    ) is not None

    bookmarked = db.scalar(
        select(DocumentBookmark).where(
            DocumentBookmark.user_id == current_user.id,
            DocumentBookmark.document_id == document.id,
        )
    ) is not None

    like_count = get_like_count(document.id, db)

    return {
        "liked": liked,
        "bookmarked": bookmarked,
        "like_count": like_count,
    }

@router.post("/{document_id}/view")
def record_document_view(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_public_document(document_id, db)

    existing_view = db.scalar(
        select(DocumentView).where(
            DocumentView.user_id == current_user.id,
            DocumentView.document_id == document.id,
        )
    )

    now = datetime.now(timezone.utc)

    if existing_view:
        existing_view.last_viewed_at = now
        db.commit()

        return {
            "message": "Document view history updated.",
            "viewed": True,
            "last_viewed_at": existing_view.last_viewed_at,
        }

    view = DocumentView(
        user_id=current_user.id,
        document_id=document.id,
        last_viewed_at=now,
    )

    db.add(view)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_view = db.scalar(
            select(DocumentView).where(
                DocumentView.user_id == current_user.id,
                DocumentView.document_id == document.id,
            )
        )

        if not existing_view:
            raise

    return {
        "message": "Document view recorded.",
        "viewed": True,
        "last_viewed_at": now,
    }


@user_router.get("/history")
def get_view_history(
    page: int = Query(
        default=1,
        ge=1,
        description="Page number.",
    ),
    page_size: int = Query(
        default=12,
        ge=1,
        le=100,
        description="Number of history items per page.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [
        DocumentView.user_id == current_user.id,
        Document.is_public.is_(True),
        Document.is_active.is_(True),
    ]

    total = (
        db.scalar(
            select(func.count(DocumentView.id))
            .join(
                Document,
                Document.id == DocumentView.document_id,
            )
            .where(*filters)
        )
        or 0
    )

    total_pages = ceil(total / page_size) if total else 0

    offset = (page - 1) * page_size

    query = (
        select(Document, DocumentView.last_viewed_at)
        .join(
            Document,
            Document.id == DocumentView.document_id,
        )
        .options(
            selectinload(Document.categories),
            selectinload(Document.files),
            selectinload(Document.document_metadata),
        )
        .where(*filters)
        .order_by(DocumentView.last_viewed_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    results = db.execute(query).unique().all()

    items = []

    for document, last_viewed_at in results:
        document_data = build_public_document_response(document)

        items.append(
            {
                **document_data.model_dump(),
                "last_viewed_at": last_viewed_at,
            }
        )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }
