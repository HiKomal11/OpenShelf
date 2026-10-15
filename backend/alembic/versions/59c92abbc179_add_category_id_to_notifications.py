"""add category_id to notifications

Revision ID: 59c92abbc179
Revises: 79dd763ae973
Create Date: 2026-10-04 18:39:37.071720

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "59c92abbc179"
down_revision: Union[str, Sequence[str], None] = "79dd763ae973"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "notifications",
        sa.Column(
            "category_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        op.f("ix_notifications_category_id"),
        "notifications",
        ["category_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_notifications_category_id_categories",
        "notifications",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "fk_notifications_category_id_categories",
        "notifications",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_notifications_category_id"),
        table_name="notifications",
    )

    op.drop_column(
        "notifications",
        "category_id",
    )