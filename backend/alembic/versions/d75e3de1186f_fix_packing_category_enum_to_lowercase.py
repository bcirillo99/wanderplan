"""fix packing category enum to lowercase

Revision ID: d75e3de1186f
Revises: 2f36b86877e8
Create Date: 2026-04-11 12:59:01.110499

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd75e3de1186f'
down_revision: Union[str, Sequence[str], None] = '2f36b86877e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # rinomina il vecchio enum
    op.execute("ALTER TYPE packingcategory RENAME TO packingcategory_old")
    
    # crea il nuovo enum con tutti valori minuscoli
    op.execute("""
        CREATE TYPE packingcategory AS ENUM (
            'documents', 'clothing', 'medicine', 'technology', 
            'extras', 'toiletries', 'accessories', 'food', 'comfort'
        )
    """)
    
    # aggiorna la colonna per usare il nuovo enum
    op.execute("""
        ALTER TABLE packing_items 
        ALTER COLUMN category TYPE packingcategory 
        USING lower(category::text)::packingcategory
    """)
    
    # cancella il vecchio enum
    op.execute("DROP TYPE packingcategory_old")


def downgrade() -> None:
    pass
