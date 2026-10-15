
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.config import settings
from app.core.ocr import extract_text_from_pdf, needs_ocr, ocr_pdf
from app.core.pdf import validate_pdf_file
from app.core.storage import (
    delete_from_r2,
    get_ocr_file_path,
    get_original_file_path,
    get_storage_key,
    is_r2_enabled,
    materialize_stored_file,
    r2_object_exists,
    upload_to_r2,
)
from app.db.session import get_db
from app.models.document import Document
from app.models.document_file import DocumentFile
from app.models.document_metadata import DocumentMetadata
from app.models.user import User
from app.services.notification_service import notify_all_active_users


router = APIRouter(
    prefix="/admin/documents",
    tags=["Admin Document Files"],
)


@router.post(
    "/{document_id}/file",
    status_code=status.HTTP_201_CREATED,
)
def upload_document_file(
    document_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    document = db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    existing_original = db.scalar(
        select(DocumentFile).where(
            DocumentFile.document_id == document_id,
            DocumentFile.is_original.is_(True),
        )
    )

    if existing_original is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An original PDF already exists for this document.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A PDF file is required.",
        )

    original_filename = Path(file.filename).name

    if Path(original_filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed.",
        )

    if file.content_type not in (
        None,
        "",
        "application/pdf",
        "application/octet-stream",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file must be a PDF.",
        )

    max_size_bytes = settings.MAX_PDF_SIZE_MB * 1024 * 1024

    temp_path: Path | None = None
    final_path: Path | None = None
    ocr_path: Path | None = None

    original_uploaded_to_r2 = False
    original_r2_key: str | None = None
    ocr_uploaded_to_r2 = False
    ocr_r2_key: str | None = None
    checksum: str | None = None

    try:
        # 1. Save the uploaded PDF to a temporary file.
        with NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp_file:
            temp_path = Path(temp_file.name)
            total_size = 0

            while True:
                chunk = file.file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            "PDF file exceeds the maximum size of "
                            f"{settings.MAX_PDF_SIZE_MB} MB."
                        ),
                    )

                temp_file.write(chunk)

        # 2. Validate the PDF and calculate its checksum.
        try:
            page_count, checksum = validate_pdf_file(temp_path)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

        # 3. Prevent duplicate uploads for this document.
        existing_file = db.scalar(
            select(DocumentFile).where(
                DocumentFile.document_id == document_id,
                DocumentFile.checksum == checksum,
            )
        )

        if existing_file is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This PDF has already been uploaded for this document.",
            )

        # 4. Store the original PDF locally or in Cloudflare R2.
        r2_enabled = is_r2_enabled()
        original_r2_key = get_storage_key(document_id)

        if r2_enabled:
            if r2_object_exists(original_r2_key):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An original PDF already exists for this document.",
                )

            upload_to_r2(temp_path, original_r2_key)
            original_uploaded_to_r2 = True

            # Keep the temporary copy available for OCR.
            stored_file_path = original_r2_key
            stored_file_size = temp_path.stat().st_size

        else:
            final_path = get_original_file_path(document_id)

            if final_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An original PDF already exists for this document.",
                )

            final_path.parent.mkdir(parents=True, exist_ok=True)

            shutil.move(
                str(temp_path),
                str(final_path),
            )
            temp_path = None

            stored_file_path = str(
                final_path.relative_to(settings.BASE_DIR)
            )
            stored_file_size = final_path.stat().st_size

        # 5. Create the original PDF database record.
        document_file = DocumentFile(
            document_id=document_id,
            file_name=original_filename,
            file_path=stored_file_path,
            file_size=stored_file_size,
            mime_type="application/pdf",
            checksum=checksum,
            is_original=True,
            is_ocr_version=False,
            ocr_status="pending",
        )

        db.add(document_file)

        # 6. Create or update document metadata.
        metadata = db.get(
            DocumentMetadata,
            document_id,
        )

        if metadata is None:
            metadata = DocumentMetadata(
                document_id=document_id,
                page_count=page_count,
                extracted_text=None,
            )
            db.add(metadata)
        else:
            metadata.page_count = page_count

        # 7. Flush and commit the original PDF record.
        db.flush()
        db.commit()
        db.refresh(document_file)

        # 8. Process searchable text and OCR.
        source_path = temp_path if r2_enabled else final_path

        if source_path is None or not source_path.is_file():
            raise RuntimeError(
                "Original PDF is unavailable for processing."
            )

        if r2_enabled:
            # Use a temporary output file for OCR when using R2.
            with NamedTemporaryFile(
                delete=False,
                suffix=".pdf",
            ) as temp_ocr_file:
                ocr_path = Path(temp_ocr_file.name)
        else:
            # Local storage keeps the OCR version alongside the original.
            ocr_path = get_ocr_file_path(document_id)

        try:
            if needs_ocr(source_path):
                document_file.ocr_status = "processing"
                db.commit()

                ocr_text = ocr_pdf(
                    input_pdf_path=source_path,
                    output_pdf_path=ocr_path,
                )

                if r2_enabled:
                    ocr_r2_key = get_storage_key(
                        document_id,
                        ocr=True,
                    )
                    upload_to_r2(
                        ocr_path,
                        ocr_r2_key,
                    )
                    ocr_uploaded_to_r2 = True
                    stored_ocr_path = ocr_r2_key
                else:
                    stored_ocr_path = str(
                        ocr_path.relative_to(settings.BASE_DIR)
                    )

                ocr_file = DocumentFile(
                    document_id=document_id,
                    file_name="ocr.pdf",
                    file_path=stored_ocr_path,
                    mime_type="application/pdf",
                    file_size=ocr_path.stat().st_size,
                    checksum=None,
                    is_original=False,
                    is_ocr_version=True,
                    ocr_status="completed",
                )
                db.add(ocr_file)

                metadata = db.get(
                    DocumentMetadata,
                    document_id,
                )

                if metadata is None:
                    metadata = DocumentMetadata(
                        document_id=document_id,
                        page_count=page_count,
                        extracted_text=ocr_text,
                    )
                    db.add(metadata)
                else:
                    metadata.page_count = page_count
                    metadata.extracted_text = ocr_text

                document_file.ocr_status = "completed"
                db.commit()

            else:
                extracted_text = extract_text_from_pdf(source_path)

                metadata = db.get(
                    DocumentMetadata,
                    document_id,
                )

                if metadata is None:
                    metadata = DocumentMetadata(
                        document_id=document_id,
                        page_count=page_count,
                        extracted_text=extracted_text,
                    )
                    db.add(metadata)
                else:
                    metadata.page_count = page_count
                    metadata.extracted_text = extracted_text

                document_file.ocr_status = "not_required"
                db.commit()

        except Exception:
            db.rollback()

            # Remove the OCR object only if the database did not
            # successfully retain a reference to it.
            if r2_enabled and ocr_uploaded_to_r2 and ocr_r2_key:
                try:
                    db_ocr_file = db.scalar(
                        select(DocumentFile).where(
                            DocumentFile.document_id == document_id,
                            DocumentFile.file_path == ocr_r2_key,
                            DocumentFile.is_ocr_version.is_(True),
                        )
                    )

                    if db_ocr_file is None:
                        delete_from_r2(ocr_r2_key)
                except Exception:
                    pass

            failed_file = db.get(
                DocumentFile,
                document_file.id,
            )

            if failed_file is not None:
                failed_file.ocr_status = "failed"
                db.commit()

            raise

        finally:
            # R2 OCR output is temporary; the uploaded R2 object is retained.
            if r2_enabled and ocr_path is not None:
                ocr_path.unlink(missing_ok=True)

        # 9. Notify users after successful PDF processing.
        if (
            document.is_public
            and document.is_active
            and document_file.ocr_status in ("completed", "not_required")
        ):
            notify_all_active_users(
                db,
                notification_type="document",
                title="New PDF available",
                message=(
                    f'A new PDF "{document.title}" has been added '
                    "to the library."
                ),
                document_id=document.id,
            )
            db.commit()

        # 10. Return the upload result.
        db.refresh(document_file)

        return {
            "message": "PDF uploaded successfully.",
            "document_id": str(document_id),
            "file_id": str(document_file.id),
            "file_name": document_file.file_name,
            "file_size": document_file.file_size,
            "page_count": page_count,
            "checksum": checksum,
            "ocr_status": document_file.ocr_status,
        }

    except HTTPException:
        db.rollback()

        # Preserve stored files if the committed database record references them.
        db_file_exists = None

        if checksum is not None:
            try:
                db_file_exists = db.scalar(
                    select(DocumentFile).where(
                        DocumentFile.document_id == document_id,
                        DocumentFile.checksum == checksum,
                        DocumentFile.is_original.is_(True),
                    )
                )
            except Exception:
                db_file_exists = None

        if db_file_exists is None:
            if final_path is not None:
                final_path.unlink(missing_ok=True)

            if original_uploaded_to_r2 and original_r2_key:
                try:
                    delete_from_r2(original_r2_key)
                except Exception:
                    pass

        raise

    except Exception as exc:
        db.rollback()

        # Preserve stored files if a committed record references the original.
        db_file_exists = None

        if checksum is not None:
            try:
                db_file_exists = db.scalar(
                    select(DocumentFile).where(
                        DocumentFile.document_id == document_id,
                        DocumentFile.checksum == checksum,
                        DocumentFile.is_original.is_(True),
                    )
                )
            except Exception:
                db_file_exists = None

        if db_file_exists is None:
            if final_path is not None:
                final_path.unlink(missing_ok=True)

            if original_uploaded_to_r2 and original_r2_key:
                try:
                    delete_from_r2(original_r2_key)
                except Exception:
                    pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload PDF.",
        ) from exc

    finally:
        file.file.close()

        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@router.get(
    "/{document_id}/file",
)
def get_document_file(
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

    original_file = db.scalar(
        select(DocumentFile).where(
            DocumentFile.document_id == document_id,
            DocumentFile.is_original.is_(True),
        )
    )

    if original_file is None:
        return {
            "document_id": str(document_id),
            "file": None,
            "ocr_file": None,
            "page_count": None,
            "text_available": False,
        }

    ocr_file = db.scalar(
        select(DocumentFile).where(
            DocumentFile.document_id == document_id,
            DocumentFile.is_ocr_version.is_(True),
        )
    )

    metadata = db.get(
        DocumentMetadata,
        document_id,
    )

    return {
        "document_id": str(document_id),
        "file": {
            "id": str(original_file.id),
            "file_name": original_file.file_name,
            "file_size": original_file.file_size,
            "mime_type": original_file.mime_type,
            "is_original": original_file.is_original,
            "ocr_status": original_file.ocr_status,
        },
        "ocr_file": (
            {
                "id": str(ocr_file.id),
                "file_name": ocr_file.file_name,
                "file_size": ocr_file.file_size,
                "mime_type": ocr_file.mime_type,
                "is_ocr_version": ocr_file.is_ocr_version,
                "ocr_status": ocr_file.ocr_status,
            }
            if ocr_file is not None
            else None
        ),
        "page_count": (
            metadata.page_count
            if metadata is not None
            else None
        ),
        "text_available": bool(
            metadata is not None
            and metadata.extracted_text
        ),
    }


@router.post(
    "/{document_id}/ocr/retry",
)
def retry_document_ocr(
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

    original_file = db.scalar(
        select(DocumentFile).where(
            DocumentFile.document_id == document_id,
            DocumentFile.is_original.is_(True),
        )
    )

    if original_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original PDF not found.",
        )

    original_file_id = original_file.id
    r2_enabled = is_r2_enabled()

    original_path: Path | None = None
    original_is_temporary = False
    ocr_path: Path | None = None

    ocr_uploaded_to_r2 = False
    ocr_committed = False
    ocr_r2_key = (
        f"documents/{document_id}/ocr-{uuid4().hex}.pdf"
    )

    try:
        # 1. Load the original from local storage or R2.
        original_path, original_is_temporary = materialize_stored_file(
            original_file.file_path
        )

        # 2. Create the OCR output file.
        if r2_enabled:
            with NamedTemporaryFile(
                delete=False,
                suffix=".pdf",
            ) as temp_file:
                ocr_path = Path(temp_file.name)
        else:
            ocr_directory = get_ocr_file_path(document_id).parent
            ocr_directory.mkdir(parents=True, exist_ok=True)

            with NamedTemporaryFile(
                dir=ocr_directory,
                prefix="ocr-",
                suffix=".pdf",
                delete=False,
            ) as temp_file:
                ocr_path = Path(temp_file.name)

        original_file.ocr_status = "processing"
        db.commit()

        # 3. Run OCR.
        ocr_text = ocr_pdf(
            input_pdf_path=original_path,
            output_pdf_path=ocr_path,
        )

        # 4. Store the OCR output.
        if r2_enabled:
            upload_to_r2(
                ocr_path,
                ocr_r2_key,
            )
            ocr_uploaded_to_r2 = True
            stored_ocr_path = ocr_r2_key
        else:
            stored_ocr_path = str(
                ocr_path.relative_to(settings.BASE_DIR)
            )

        # 5. Replace the previous OCR database record, if present.
        existing_ocr_file = db.scalar(
            select(DocumentFile).where(
                DocumentFile.document_id == document_id,
                DocumentFile.is_ocr_version.is_(True),
            )
        )

        old_ocr_path = (
            existing_ocr_file.file_path
            if existing_ocr_file is not None
            else None
        )

        if existing_ocr_file is not None:
            db.delete(existing_ocr_file)
            db.flush()

        ocr_file = DocumentFile(
            document_id=document_id,
            file_name="ocr.pdf",
            file_path=stored_ocr_path,
            mime_type="application/pdf",
            file_size=ocr_path.stat().st_size,
            checksum=None,
            is_original=False,
            is_ocr_version=True,
            ocr_status="completed",
        )
        db.add(ocr_file)

        # 6. Update searchable text metadata.
        metadata = db.get(
            DocumentMetadata,
            document_id,
        )

        if metadata is None:
            metadata = DocumentMetadata(
                document_id=document_id,
                page_count=None,
                extracted_text=ocr_text,
            )
            db.add(metadata)
        else:
            metadata.extracted_text = ocr_text

        original_file.ocr_status = "completed"

        # 7. Commit before deleting the previous OCR file.
        db.commit()
        ocr_committed = True
        db.refresh(ocr_file)

        if old_ocr_path and old_ocr_path != stored_ocr_path:
            if r2_enabled:
                try:
                    delete_from_r2(old_ocr_path)
                except Exception:
                    # The new OCR record is already committed.
                    # A failed old-object deletion must not undo success.
                    pass
            else:
                old_local_path = settings.BASE_DIR / old_ocr_path

                if old_local_path != ocr_path:
                    old_local_path.unlink(missing_ok=True)

        return {
            "message": "OCR retry completed successfully.",
            "document_id": str(document_id),
            "ocr_file_id": str(ocr_file.id),
            "ocr_file_name": ocr_file.file_name,
            "ocr_file_size": ocr_file.file_size,
            "ocr_status": original_file.ocr_status,
            "text_length": len(ocr_text),
        }

    except Exception as exc:
        db.rollback()

        # Only mark OCR failed if the new OCR record was not committed.
        if not ocr_committed:
            failed_file = db.get(
                DocumentFile,
                original_file_id,
            )

            if failed_file is not None:
                failed_file.ocr_status = "failed"
                db.commit()

            # Do not delete an object that is referenced by a committed record.
            if r2_enabled and ocr_uploaded_to_r2:
                try:
                    db_ocr_file = db.scalar(
                        select(DocumentFile).where(
                            DocumentFile.document_id == document_id,
                            DocumentFile.file_path == ocr_r2_key,
                            DocumentFile.is_ocr_version.is_(True),
                        )
                    )

                    if db_ocr_file is None:
                        delete_from_r2(ocr_r2_key)
                except Exception:
                    pass

            elif not r2_enabled and ocr_path is not None:
                ocr_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR retry failed.",
        ) from exc

    finally:
        if original_is_temporary and original_path is not None:
            original_path.unlink(missing_ok=True)

        if r2_enabled and ocr_path is not None:
            ocr_path.unlink(missing_ok=True)
