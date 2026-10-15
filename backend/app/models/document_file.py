from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DocumentFile(Base):
    __tablename__ = "document_files"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="application/pdf",
    )

    file_size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    checksum: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        index=True,
    )

    is_original: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    is_ocr_version: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    ocr_status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    document = relationship(
        "Document",
        back_populates="files",
    )