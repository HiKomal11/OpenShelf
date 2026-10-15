
"""add email verification fields

Revision ID: d6216cdc8300
Revises: 59c92abbc179
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d6216cdc8300"
down_revision: Union[str, Sequence[str], None] = "59c92abbc179"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing accounts remain verified.
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    # The default is only needed while migrating existing rows.
    op.alter_column(
        "users",
        "email_verified",
        server_default=None,
    )

    op.add_column(
        "users",
        sa.Column(
            "email_verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verified")