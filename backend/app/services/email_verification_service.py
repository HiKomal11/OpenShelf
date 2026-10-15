
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_verification_token import EmailVerificationToken
from app.models.user import User


def create_verification_token(db: Session, user: User) -> str:
    """Create a single-use token and return its verification URL."""

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
    )

    verification_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(verification_token)
    db.flush()

    return (
        f"{settings.FRONTEND_URL.rstrip('/')}/verify-email"
        f"?token={quote(raw_token)}"
    )


def verify_email_token(db: Session, raw_token: str) -> bool:
    """Verify an email using a valid, unexpired, unused token."""

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    verification_record = db.scalar(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.token_hash == token_hash)
        .with_for_update()
    )

    if verification_record is None:
        return False

    now = datetime.now(timezone.utc)

    if verification_record.consumed_at is not None:
        return False

    if verification_record.expires_at <= now:
        return False

    user = db.scalar(
        select(User).where(User.id == verification_record.user_id)
    )

    if user is None:
        return False

    verification_record.consumed_at = now
    user.email_verified = True
    user.email_verified_at = now

    db.commit()
    return True