"""add_stops_and_legs_to_flights

Revision ID: add_stops_legs
Revises: 961b8a053cc2
Create Date: 2026-04-27 14:04:46.477520

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_stops_legs'
down_revision: Union[str, Sequence[str], None] = '961b8a053cc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("flights", sa.Column("stops", sa.Integer(), nullable=True))
    op.add_column("flights", sa.Column("legs", sa.dialects.postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("flights", "legs")
    op.drop_column("flights", "stops")
