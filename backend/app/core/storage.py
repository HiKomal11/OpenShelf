from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID

import boto3
from botocore.exceptions import ClientError
from vercel.blob import BlobClient, BlobNotFoundError

from app.core.config import settings


def is_r2_enabled() -> bool:
    """
    Compatibility function used by existing routes.
    Returns True when a remote object-storage backend is enabled.
    """
    backend = settings.STORAGE_BACKEND.strip().lower()
    return backend in {"r2", "vercel_blob", "vercel-blob", "blob"}


def is_vercel_blob_enabled() -> bool:
    """Return True when Vercel Blob is the configured storage backend."""
    return settings.STORAGE_BACKEND.strip().lower() in {
        "vercel_blob",
        "vercel-blob",
        "blob",
    }


def get_document_storage_directory(document_id: UUID) -> Path:
    """Return the local directory used for a document."""
    directory = settings.DOCUMENT_STORAGE_DIR / str(document_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def get_original_file_path(document_id: UUID) -> Path:
    """Return the local path for the original PDF."""
    return get_document_storage_directory(document_id) / "original.pdf"


def get_ocr_file_path(document_id: UUID) -> Path:
    """Return the local path for the OCR-processed PDF."""
    return get_document_storage_directory(document_id) / "ocr.pdf"


def get_storage_key(document_id: UUID, ocr: bool = False) -> str:
    """Return the object key used by remote storage."""
    filename = "ocr.pdf" if ocr else "original.pdf"
    return f"documents/{document_id}/{filename}"


def _get_vercel_blob_client() -> BlobClient:
    """Create an authenticated Vercel Blob client."""
    token = settings.BLOB_READ_WRITE_TOKEN.strip()

    if not token:
        raise RuntimeError(
            "Vercel Blob storage is enabled, but "
            "BLOB_READ_WRITE_TOKEN is missing."
        )

    return BlobClient(token=token)


def _get_r2_client():
    """Create an S3-compatible client for legacy Cloudflare R2 storage."""
    account_id = settings.R2_ACCOUNT_ID.strip()
    endpoint_url = settings.R2_ENDPOINT_URL.strip()

    if not endpoint_url and account_id:
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    if not all(
        [
            endpoint_url,
            settings.R2_ACCESS_KEY_ID.strip(),
            settings.R2_SECRET_ACCESS_KEY.strip(),
            settings.R2_BUCKET_NAME.strip(),
        ]
    ):
        raise RuntimeError(
            "R2 storage is enabled, but its required settings are missing."
        )

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def upload_to_r2(
    local_path: Path,
    object_key: str,
    content_type: str = "application/pdf",
) -> None:
    """Upload a file to the configured remote storage backend."""
    if is_vercel_blob_enabled():
        client = _get_vercel_blob_client()
        try:
            client.upload_file(
                str(local_path),
                object_key,
                access="private",
                content_type=content_type,
                add_random_suffix=False,
                overwrite=False,
            )
        finally:
            client.close()
        return

    if settings.STORAGE_BACKEND.strip().lower() == "r2":
        client = _get_r2_client()
        try:
            client.upload_file(
                str(local_path),
                settings.R2_BUCKET_NAME,
                object_key,
                ExtraArgs={"ContentType": content_type},
            )
        finally:
            client.close()
        return

    raise RuntimeError("Remote storage upload requested, but no remote backend is enabled.")


def download_from_r2(object_key: str, destination_path: Path) -> Path:
    """Download a remote object to a local file."""
    destination_path.parent.mkdir(parents=True, exist_ok=True)

    if is_vercel_blob_enabled():
        client = _get_vercel_blob_client()
        try:
            client.download_file(
                object_key,
                str(destination_path),
                access="private",
                overwrite=True,
                create_parents=True,
            )
        finally:
            client.close()
        return destination_path

    if settings.STORAGE_BACKEND.strip().lower() == "r2":
        client = _get_r2_client()
        try:
            client.download_file(
                settings.R2_BUCKET_NAME,
                object_key,
                str(destination_path),
            )
        finally:
            client.close()
        return destination_path

    raise RuntimeError("Remote storage download requested, but no remote backend is enabled.")


def delete_from_r2(object_key: str) -> None:
    """Delete an object from the configured remote storage backend."""
    if is_vercel_blob_enabled():
        client = _get_vercel_blob_client()
        try:
            client.delete(object_key)
        finally:
            client.close()
        return

    if settings.STORAGE_BACKEND.strip().lower() == "r2":
        client = _get_r2_client()
        try:
            client.delete_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=object_key,
            )
        finally:
            client.close()
        return

    raise RuntimeError("Remote storage deletion requested, but no remote backend is enabled.")


def r2_object_exists(object_key: str) -> bool:
    """Check whether an object exists in the configured remote backend."""
    if is_vercel_blob_enabled():
        client = _get_vercel_blob_client()
        try:
            client.head(object_key)
            return True
        except BlobNotFoundError:
            return False
        finally:
            client.close()

    if settings.STORAGE_BACKEND.strip().lower() == "r2":
        client = _get_r2_client()
        try:
            client.head_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=object_key,
            )
            return True
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            status_code = exc.response.get("ResponseMetadata", {}).get(
                "HTTPStatusCode"
            )

            if error_code in ("404", "NoSuchKey", "NotFound") or status_code == 404:
                return False

            raise
        finally:
            client.close()

    raise RuntimeError("Remote storage check requested, but no remote backend is enabled.")


def materialize_stored_file(file_path: str) -> tuple[Path, bool]:
    """
    Resolve a stored file to a local path.

    Returns (path, is_temporary).
    Local files are not temporary; remote downloads are temporary.
    """
    if not is_r2_enabled():
        local_path = settings.BASE_DIR / file_path

        if not local_path.is_file():
            raise FileNotFoundError("Stored PDF file was not found.")

        return local_path, False

    with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_path = Path(temp_file.name)

    try:
        download_from_r2(file_path, temp_path)
        return temp_path, True
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise
