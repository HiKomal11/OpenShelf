from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.storage import materialize_stored_file
from app.db.session import get_db
from app.models.document import Document
from app.models.document_category import DocumentCategory
from app.models.document_metadata import DocumentMetadata
from app.schemas.document import PublicDocumentResponse

router = APIRouter(
    prefix="/documents",
    tags=["Public Documents"],
)


def get_public_document_query():
    return (
        select(Document)
        .options(
            selectinload(Document.categories),
            selectinload(Document.files),
            selectinload(Document.document_metadata),
        )
        .where(
            Document.is_public.is_(True),
            Document.is_active.is_(True),
        )
        .order_by(Document.created_at.desc())
    )


def build_public_document_response(
    document: Document,
) -> PublicDocumentResponse:
    original_file = next(
        (
            file
            for file in document.files
            if file.is_original
        ),
        None,
    )

    page_count = None

    if document.document_metadata is not None:
        page_count = document.document_metadata.page_count

    file_data = None

    if original_file is not None:
        file_data = {
            "file_name": original_file.file_name,
            "file_size": original_file.file_size,
            "mime_type": original_file.mime_type,
            "ocr_status": original_file.ocr_status,
        }

    return PublicDocumentResponse(
        id=document.id,
        title=document.title,
        description=document.description,
        author=document.author,
        language=document.language,
        publication_date=document.publication_date,
        categories=document.categories,
        page_count=page_count,
        file=file_data,
    )


@router.get("")
def list_public_documents(
    search: str | None = Query(
        default=None,
        description=(
            "Search title, description, author, "
            "and extracted/OCR document text."
        ),
    ),
    category_id: int | None = Query(
        default=None,
        ge=1,
        description="Filter documents by category ID.",
    ),
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
        sort: str = Query(
        default="newest",
        description=(
            "Sort order: newest, oldest, title_asc, title_desc."
        ),
    ),
    db: Session = Depends(get_db),
):
    search_term = search.strip() if search else None
    allowed_sorts = {
        "newest",
        "oldest",
        "title_asc",
        "title_desc",
    }

    if sort not in allowed_sorts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid sort option. "
                "Use newest, oldest, title_asc, or title_desc."
            ),
        )

    filters = [
        Document.is_public.is_(True),
        Document.is_active.is_(True),
    ]

    search_rank = None

    if search_term:
        pattern = f"%{search_term}%"

        metadata_text = (
            select(DocumentMetadata.extracted_text)
            .where(
                DocumentMetadata.document_id == Document.id
            )
            .scalar_subquery()
        )

        search_vector = (
            func.setweight(
                func.to_tsvector(
                    "simple",
                    func.coalesce(Document.title, ""),
                ),
                "A",
            )
            .op("||")(
                func.setweight(
                    func.to_tsvector(
                        "simple",
                        func.coalesce(Document.author, ""),
                    ),
                    "B",
                )
            )
            .op("||")(
                func.setweight(
                    func.to_tsvector(
                        "simple",
                        func.coalesce(Document.description, ""),
                    ),
                    "B",
                )
            )
            .op("||")(
                func.setweight(
                    func.to_tsvector(
                        "simple",
                        func.coalesce(metadata_text, ""),
                    ),
                    "C",
                )
            )
        )

        search_query = func.websearch_to_tsquery(
            "simple",
            search_term,
        )

        search_rank = func.ts_rank(
            search_vector,
            search_query,
        )

        metadata_text_exists = select(
            DocumentMetadata.document_id
        ).where(
            DocumentMetadata.document_id == Document.id,
            DocumentMetadata.extracted_text.ilike(pattern),
        ).exists()

        fuzzy_ocr_exists = False

        if len(search_term) >= 0.40:
            fuzzy_ocr_exists = select(
                DocumentMetadata.document_id
            ).where(
                DocumentMetadata.document_id == Document.id,
                func.word_similarity(
                    search_term,
                    func.lower(
                        func.coalesce(
                            DocumentMetadata.extracted_text,
                            "",
                        )
                    ),
                ) >= 0.40,
            ).exists()

        filters.append(
            or_(
                Document.title.ilike(pattern),
                Document.description.ilike(pattern),
                Document.author.ilike(pattern),
                metadata_text_exists,
                search_rank > 0,
                fuzzy_ocr_exists,
            )
        )

    if category_id is not None:
        filters.append(
            Document.id.in_(
                select(DocumentCategory.document_id).where(
                    DocumentCategory.category_id == category_id
                )
            )
        )

    total = db.scalar(
        select(func.count(Document.id)).where(*filters)
    ) or 0

    total_pages = ceil(total / page_size) if total else 0

    offset = (page - 1) * page_size

    query = (
        select(Document)
        .options(
            selectinload(Document.categories),
            selectinload(Document.files),
            selectinload(Document.document_metadata),
        )
        .where(*filters)
    )

    if search_rank is not None:
        query = query.order_by(
            search_rank.desc(),
        )

    if sort == "newest":
        query = query.order_by(
            Document.created_at.desc()
        )
    elif sort == "oldest":
        query = query.order_by(
            Document.created_at.asc()
        )
    elif sort == "title_asc":
        query = query.order_by(
            func.lower(Document.title).asc(),
            Document.created_at.desc(),
        )
    elif sort == "title_desc":
        query = query.order_by(
            func.lower(Document.title).desc(),
            Document.created_at.desc(),
        )
    query = (
        query
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


@router.get(
    "/{document_id}",
    response_model=PublicDocumentResponse,
)
def get_public_document(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    document = db.scalar(
        get_public_document_query().where(
            Document.id == document_id
        )
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public document not found.",
        )

    return build_public_document_response(document)


@router.get("/{document_id}/view")
def view_public_document(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    document = db.scalar(
        get_public_document_query().where(
            Document.id == document_id
        )
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public document not found.",
        )

    original_file = next(
        (
            file
            for file in document.files
            if file.is_original
        ),
        None,
    )

    if original_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original PDF file not found.",
        )


    try:
        file_path, is_temporary = materialize_stored_file(
            original_file.file_path
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file is missing from storage.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF storage is temporarily unavailable.",
        ) from exc

    return FileResponse(
        path=file_path,
        media_type=original_file.mime_type,
        headers={"Content-Disposition": "inline"},
        background=(
            BackgroundTask(file_path.unlink, missing_ok=True)
            if is_temporary
            else None
        ),
    )


@router.get("/{document_id}/download")
def download_public_document(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    document = db.scalar(
        get_public_document_query().where(
            Document.id == document_id
        )
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public document not found.",
        )

    original_file = next(
        (
            file
            for file in document.files
            if file.is_original
        ),
        None,
    )

    if original_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original PDF file not found.",
        )


    try:
        file_path, is_temporary = materialize_stored_file(
            original_file.file_path
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file is missing from storage.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF storage is temporarily unavailable.",
        ) from exc

    return FileResponse(
        path=file_path,
        media_type=original_file.mime_type,
        filename=original_file.file_name,
        background=(
            BackgroundTask(file_path.unlink, missing_ok=True)
            if is_temporary
            else None
        ),
    )
