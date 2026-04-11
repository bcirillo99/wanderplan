"""fix all enums to lowercase

Revision ID: f1a2b3c4d5e6
Revises: d75e3de1186f
Create Date: 2026-04-11 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd75e3de1186f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix status enum
    op.execute("ALTER TYPE status RENAME TO status_old")
    op.execute("""
        CREATE TYPE status AS ENUM (
            'draft', 'to_book', 'booked', 'cancelled', 'completed'
        )
    """)
    op.execute("""
        ALTER TABLE activities 
        ALTER COLUMN status TYPE status 
        USING lower(status::text)::status
    """)
    op.execute("""
        ALTER TABLE flights 
        ALTER COLUMN status TYPE status 
        USING lower(status::text)::status
    """)
    op.execute("""
        ALTER TABLE accommodations 
        ALTER COLUMN status TYPE status 
        USING lower(status::text)::status
    """)
    op.execute("""
        ALTER TABLE transports 
        ALTER COLUMN status TYPE status 
        USING lower(status::text)::status
    """)
    op.execute("DROP TYPE status_old")
    
    # Fix accommodationtype enum
    op.execute("ALTER TYPE accommodationtype RENAME TO accommodationtype_old")
    op.execute("""
        CREATE TYPE accommodationtype AS ENUM (
            'hotel', 'hostel', 'airbnb', 'lodge', 'camping', 'resort', 'apartment', 'other'
        )
    """)
    op.execute("""
        ALTER TABLE accommodations 
        ALTER COLUMN accommodation_type TYPE accommodationtype 
        USING lower(accommodation_type::text)::accommodationtype
    """)
    op.execute("DROP TYPE accommodationtype_old")
    
    # Fix transporttype enum
    op.execute("ALTER TYPE transporttype RENAME TO transporttype_old")
    op.execute("""
        CREATE TYPE transporttype AS ENUM (
            'train', 'bus', 'car', 'shuttle', 'ferry', 'taxi', 'other'
        )
    """)
    op.execute("""
        ALTER TABLE transports 
        ALTER COLUMN transport_type TYPE transporttype 
        USING lower(transport_type::text)::transporttype
    """)
    op.execute("DROP TYPE transporttype_old")


def downgrade() -> None:
    pass
