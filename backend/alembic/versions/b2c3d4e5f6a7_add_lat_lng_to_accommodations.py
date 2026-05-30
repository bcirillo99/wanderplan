"""add lat lng to accommodations

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-30 00:01:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('accommodations', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('accommodations', sa.Column('longitude', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('accommodations', 'longitude')
    op.drop_column('accommodations', 'latitude')
