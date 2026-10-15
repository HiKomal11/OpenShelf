"""seed default user roles

Revision ID: d71e08fa6798
Revises: 242c79f1fc7f
Create Date: 2026-09-30
"""

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d71e08fa6798"
down_revision = "242c79f1fc7f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    roles_table = sa.table(
        "roles",
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )

    created_at = datetime.now(timezone.utc)

    op.bulk_insert(
        roles_table,
        [
            {
                "name": "USER",
                "description": "Standard library user",
                "created_at": created_at,
            },
            {
                "name": "ADMIN",
                "description": "Library administrator",
                "created_at": created_at,
            },
        ],
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM roles
            WHERE name IN ('USER', 'ADMIN')
            """
        )
    )