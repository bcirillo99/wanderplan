"""fix accommodationtype enum with other instead of extras

Revision ID: f3c4d5e6f7g8
Revises: f2b3c4d5e6f7
Create Date: 2026-04-11 13:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3c4d5e6f7g8'
down_revision: Union[str, Sequence[str], None] = 'f2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix accommodationtype enum - replace EXTRAS with OTHER and convert to lowercase
    op.execute("ALTER TYPE accommodationtype RENAME TO accommodationtype_old")
    op.execute("""
        CREATE TYPE accommodationtype AS ENUM (
            'hotel', 'hostel', 'airbnb', 'lodge', 'camping', 'resort', 'apartment', 'other'
        )
    """)
    op.execute("""
        ALTER TABLE accommodations 
        ALTER COLUMN accommodation_type TYPE accommodationtype 
        USING CASE 
            WHEN accommodation_type::text = 'HOTEL' THEN 'hotel'::accommodationtype
            WHEN accommodation_type::text = 'HOSTEL' THEN 'hostel'::accommodationtype
            WHEN accommodation_type::text = 'AIRBNB' THEN 'airbnb'::accommodationtype
            WHEN accommodation_type::text = 'LODGE' THEN 'lodge'::accommodationtype
            WHEN accommodation_type::text = 'CAMPING' THEN 'camping'::accommodationtype
            WHEN accommodation_type::text = 'RESORT' THEN 'resort'::accommodationtype
            WHEN accommodation_type::text = 'APARTMENT' THEN 'apartment'::accommodationtype
            WHEN accommodation_type::text = 'EXTRAS' THEN 'other'::accommodationtype
            ELSE 'other'::accommodationtype
        END
    """)
    op.execute("DROP TYPE accommodationtype_old")


def downgrade() -> None:
    pass
