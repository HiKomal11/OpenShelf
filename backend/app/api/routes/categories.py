from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.notification_service import notify_all_active_users
router = APIRouter(
    prefix="/admin/categories",
    tags=["Admin Categories"],
)


@router.get(
    "",
    response_model=list[CategoryResponse],
)
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return db.scalars(
        select(Category).order_by(Category.name)
    ).all()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    existing_category = db.scalar(
        select(Category).where(
            (Category.name == category_data.name)
            | (Category.slug == category_data.slug)
        )
    )

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name or slug already exists.",
        )

    category = Category(
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
        is_active=category_data.is_active,
    )

    db.add(category)

    try:
        # Flush first so the new category gets its database ID.
        db.flush()

        # Notify all active registered users.
        notify_all_active_users(
            db,
            notification_type="category",
            title="New category available",
            message=f'A new category "{category.name}" has been added to the library.',
            category_id=category.id,
        )

        # Commit category + notifications together.
        db.commit()

        db.refresh(category)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name or slug already exists.",
        )

    return category

@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    update_data = category_data.model_dump(exclude_unset=True)

    if "name" in update_data or "slug" in update_data:
        name = update_data.get("name", category.name)
        slug = update_data.get("slug", category.slug)

        duplicate = db.scalar(
            select(Category).where(
                Category.id != category_id,
                (Category.name == name) | (Category.slug == slug),
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A category with this name or slug already exists.",
            )

    for field, value in update_data.items():
        setattr(category, field, value)

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name or slug already exists.",
        )

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    db.delete(category)
    db.commit()