import hashlib
from pathlib import Path

from pypdf import PdfReader


PDF_MIME_TYPE = "application/pdf"
PDF_EXTENSION = ".pdf"


def validate_pdf_file(
    file_path: Path,
) -> tuple[int, str]:
    """
    Validate that the uploaded file is a readable PDF.

    Returns:
        page_count, checksum
    """

    if file_path.suffix.lower() != PDF_EXTENSION:
        raise ValueError("Only PDF files are allowed.")

    if not file_path.exists():
        raise ValueError("PDF file does not exist.")

    try:
        reader = PdfReader(str(file_path))
        page_count = len(reader.pages)
    except Exception as exc:
        raise ValueError(
            "The uploaded file is not a valid readable PDF."
        ) from exc

    checksum_hash = hashlib.sha256()

    with file_path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            checksum_hash.update(chunk)

    checksum = checksum_hash.hexdigest()

    return page_count, checksum