from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    author: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    language: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    publication_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    uploaded_by: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    uploader = relationship(
        "User",
        foreign_keys=[uploaded_by],
    )

    categories = relationship(
        "Category",
        secondary="document_categories",
        back_populates="documents",
    )

    files = relationship(
        "DocumentFile",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    document_metadata = relationship(
        "DocumentMetadata",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan",
    )

    access_rules = relationship(
        "DocumentAccess",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    notifications = relationship(
        "Notification",
        back_populates="document",
        cascade="all, delete-orphan",
    )