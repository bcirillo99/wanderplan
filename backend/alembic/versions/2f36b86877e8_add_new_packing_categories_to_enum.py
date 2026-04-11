"""add new packing categories to enum

Revision ID: 2f36b86877e8
Revises: 29d615420a10
Create Date: 2026-04-11 12:48:16.955522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f36b86877e8'
down_revision: Union[str, Sequence[str], None] = '29d615420a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE packingcategory ADD VALUE 'toiletries'")
    op.execute("ALTER TYPE packingcategory ADD VALUE 'accessories'")
    op.execute("ALTER TYPE packingcategory ADD VALUE 'food'")
    op.execute("ALTER TYPE packingcategory ADD VALUE 'comfort'")


def downgrade() -> None:
    # PostgreSQL non supporta DROP VALUE da un enum
    # per fare downgrade bisognerebbe ricreare l'enum da zero
    pass
