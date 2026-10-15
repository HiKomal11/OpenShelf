from pathlib import Path

import pymupdf
import pytesseract
from PIL import Image
import os
import shutil


# Prefer an explicitly configured executable, then search PATH,
# then use the standard Windows installation path.
TESSERACT_PATH = Path(
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

OCR_LANGUAGES = "eng+hin+mar"

# A PDF with at least this much extracted text is treated
# as a machine-readable PDF and does not require OCR.
MIN_TEXT_LENGTH = 50


def configure_tesseract() -> None:
    """
    Configure Tesseract on Windows or Linux.
    """
    configured_path = os.getenv("TESSERACT_CMD", "").strip()

    if configured_path:
        executable = Path(configured_path)
        if not executable.is_file():
            raise FileNotFoundError(
                f"Tesseract executable not found: {configured_path}"
            )
        pytesseract.pytesseract.tesseract_cmd = str(executable)
        return

    discovered_path = shutil.which("tesseract")
    if discovered_path:
        pytesseract.pytesseract.tesseract_cmd = discovered_path
        return

    if TESSERACT_PATH.is_file():
        pytesseract.pytesseract.tesseract_cmd = str(TESSERACT_PATH)
        return

    raise FileNotFoundError(
        "Tesseract executable not found. Install Tesseract OCR or "
        "set the TESSERACT_CMD environment variable."
    )



def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract machine-readable text from a PDF.
    """
    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {pdf_path}"
        )

    text_parts: list[str] = []

    with pymupdf.open(pdf_path) as pdf:
        for page in pdf:
            text = page.get_text("text").strip()

            if text:
                text_parts.append(text)

    return "\n\n".join(text_parts).strip()


def needs_ocr(pdf_path: Path) -> bool:
    """
    Determine whether a PDF needs OCR.

    If enough machine-readable text already exists,
    OCR is not required.
    """
    extracted_text = extract_text_from_pdf(pdf_path)

    return len(extracted_text.strip()) < MIN_TEXT_LENGTH


def ocr_pdf(
    input_pdf_path: Path,
    output_pdf_path: Path,
) -> str:
    """
    OCR a PDF and create a searchable OCR PDF.

    The original PDF is never modified.

    Returns the extracted OCR text.
    """
    if not input_pdf_path.exists():
        raise FileNotFoundError(
            f"Input PDF not found: {input_pdf_path}"
        )

    output_pdf_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    configure_tesseract()

    text_parts: list[str] = []

    with pymupdf.open(input_pdf_path) as source_pdf:
        output_pdf = pymupdf.open()

        try:
            for page in source_pdf:
                # Render the PDF page at 200 DPI.
                zoom = 200 / 72
                matrix = pymupdf.Matrix(zoom, zoom)

                pixmap = page.get_pixmap(
                    matrix=matrix,
                    alpha=False,
                )

                image = Image.frombytes(
                    "RGB",
                    [pixmap.width, pixmap.height],
                    pixmap.samples,
                )

                page_text = pytesseract.image_to_string(
                    image,
                    lang=OCR_LANGUAGES,
                ).strip()

                if page_text:
                    text_parts.append(page_text)

                # Create a new PDF page with the same dimensions.
                output_page = output_pdf.new_page(
                    width=page.rect.width,
                    height=page.rect.height,
                )

                # Insert rendered page image.
                output_page.insert_image(
                    output_page.rect,
                    stream=pixmap.tobytes("png"),
                )

                # Add invisible searchable OCR text.
                if page_text:
                    output_page.insert_textbox(
                        output_page.rect,
                        page_text,
                        fontsize=1,
                        color=(0, 0, 0),
                        render_mode=3,
                    )

        finally:
            output_pdf.save(str(output_pdf_path))
            output_pdf.close()

    return "\n\n".join(text_parts).strip()