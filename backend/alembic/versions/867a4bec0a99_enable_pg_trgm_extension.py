"""enable pg_trgm extension

Revision ID: 867a4bec0a99
Revises: ae52fc5d6a88
Create Date: 2026-10-04 11:53:18.168623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '867a4bec0a99'
down_revision: Union[str, Sequence[str], None] = 'ae52fc5d6a88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")