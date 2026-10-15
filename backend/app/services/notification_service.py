from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    *,
    user_id: UUID,
    notification_type: str,
    title: str,
    message: str,
    document_id: UUID | None = None,
    category_id: int | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        document_id=document_id,
        category_id=category_id,
    )

    db.add(notification)
    db.flush()

    return notification


def notify_all_active_users(
    db: Session,
    *,
    notification_type: str,
    title: str,
    message: str,
    document_id: UUID | None = None,
    category_id: int | None = None,
) -> int:
    active_user_ids = db.scalars(
        select(User.id).where(
            User.is_active.is_(True)
        )
    ).all()

    for user_id in active_user_ids:
        create_notification(
            db,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            document_id=document_id,
            category_id=category_id,
        )

    return len(active_user_ids)