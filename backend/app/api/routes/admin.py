from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.admin_users import (
    AdminUserResponse,
    AdminUserRolesUpdate,
    AdminUserStatusUpdate,
)
from app.models.document import Document

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard")
def get_admin_dashboard(
    current_user: User = Depends(require_role("ADMIN")),
):
    return {
        "message": "Admin dashboard access granted.",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "roles": [role.name for role in current_user.roles],
        },
    }


@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    users = db.scalars(
        select(User)
        .order_by(User.created_at.desc())
    ).all()

    return [
        AdminUserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            roles=sorted(role.name for role in user.roles),
        )
        for user in users
    ]


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def get_admin_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=sorted(role.name for role in user.roles),
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_admin_user_status(
    user_id: UUID,
    status_data: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Prevent an administrator from deactivating their own account.
    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    # Prevent the last active administrator from being deactivated.
    if not status_data.is_active:
        is_admin = any(
            role.name == "ADMIN"
            for role in user.roles
        )

        if is_admin:
            active_admin_count = db.scalar(
                select(func.count(User.id))
                .join(User.roles)
                .where(
                    User.is_active.is_(True),
                    Role.name == "ADMIN",
                )
            ) or 0

            if active_admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The last active administrator cannot be deactivated.",
                )

    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=sorted(role.name for role in user.roles),
    )


@router.patch(
    "/users/{user_id}/roles",
    response_model=AdminUserResponse,
)
def update_admin_user_roles(
    user_id: UUID,
    roles_data: AdminUserRolesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    requested_roles = {
        role_name.strip().upper()
        for role_name in roles_data.roles
        if role_name.strip()
    }

    allowed_roles = {"USER", "ADMIN"}

    if not requested_roles.issubset(allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roles must contain only USER and ADMIN.",
        )

    if not requested_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user must have at least one role.",
        )

    current_role_names = {
        role.name
        for role in user.roles
    }

    # Prevent an administrator from removing their own ADMIN role.
    if (
        user.id == current_user.id
        and "ADMIN" not in requested_roles
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own ADMIN role.",
        )

    # Prevent the last active administrator from losing ADMIN.
    if (
        "ADMIN" in current_role_names
        and "ADMIN" not in requested_roles
        and user.is_active
    ):
        active_admin_count = db.scalar(
            select(func.count(User.id))
            .join(User.roles)
            .where(
                User.is_active.is_(True),
                Role.name == "ADMIN",
            )
        ) or 0

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The last active administrator cannot lose the ADMIN role.",
            )

    roles = db.scalars(
        select(Role).where(
            Role.name.in_(requested_roles)
        )
    ).all()

    role_by_name = {
        role.name: role
        for role in roles
    }

    user.roles = [
        role_by_name[role_name]
        for role_name in sorted(requested_roles)
    ]

    db.commit()
    db.refresh(user)

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=sorted(role.name for role in user.roles),
    )

@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    # Find the account to delete.
    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # An administrator cannot delete their own account.
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    # Prevent removal of the last active administrator.
    user_is_admin = any(
        role.name == "ADMIN" for role in user.roles
    )

    if user.is_active and user_is_admin:
        active_admin_count = db.scalar(
            select(func.count(User.id))
            .join(User.roles)
            .where(
                User.is_active.is_(True),
                Role.name == "ADMIN",
            )
        ) or 0

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The last active administrator cannot be deleted."
                ),
            )

    # Preserve documents uploaded by this account.
    uploaded_documents = db.scalars(
        select(Document).where(
            Document.uploaded_by == user.id
        )
    ).all()

    if uploaded_documents:
        replacement_admin = db.scalar(
            select(User)
            .join(User.roles)
            .where(
                User.is_active.is_(True),
                User.id != user.id,
                Role.name == "ADMIN",
            )
            .order_by(User.created_at.asc())
            .limit(1)
        )

        if replacement_admin is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cannot delete this account because it owns "
                    "documents and no other active administrator "
                    "is available to take ownership."
                ),
            )

        for document in uploaded_documents:
            document.uploaded_by = replacement_admin.id

    try:
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to delete this account. "
                "No changes were saved."
            ),
        )

    return {
        "message": "User account deleted successfully.",
        "user_id": str(user_id),
    }