"""fix transporttype enum with other value

Revision ID: f2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-04-11 13:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix transporttype enum - add missing OTHER and convert to lowercase
    op.execute("ALTER TYPE transporttype RENAME TO transporttype_old")
    op.execute("""
        CREATE TYPE transporttype AS ENUM (
            'train', 'bus', 'car', 'shuttle', 'ferry', 'taxi', 'other'
        )
    """)
    op.execute("""
        ALTER TABLE transports 
        ALTER COLUMN transport_type TYPE transporttype 
        USING CASE 
            WHEN transport_type::text = 'TRAIN' THEN 'train'::transporttype
            WHEN transport_type::text = 'BUS' THEN 'bus'::transporttype
            WHEN transport_type::text = 'CAR' THEN 'car'::transporttype
            WHEN transport_type::text = 'SHUTTLE' THEN 'shuttle'::transporttype
            WHEN transport_type::text = 'FERRY' THEN 'ferry'::transporttype
            WHEN transport_type::text = 'TAXI' THEN 'taxi'::transporttype
            WHEN transport_type::text = 'OTHER' THEN 'other'::transporttype
            ELSE 'other'::transporttype
        END
    """)
    op.execute("DROP TYPE transporttype_old")


def downgrade() -> None:
    pass
