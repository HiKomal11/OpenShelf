from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter(
    prefix="/categories",
    tags=["Public Categories"],
)


@router.get(
    "",
    response_model=list[CategoryResponse],
)
def list_public_categories(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Category)
        .where(Category.is_active.is_(True))
        .order_by(Category.name)
    ).all()