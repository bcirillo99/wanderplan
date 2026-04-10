"""add daily summary view

Revision ID: 29d615420a10
Revises: 0eef9bb2a2fc
Create Date: 2026-04-10 22:00:22.480307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29d615420a10'
down_revision: Union[str, Sequence[str], None] = '0eef9bb2a2fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op


def upgrade() -> None:
    op.execute("""
        CREATE VIEW daily_summary AS

        SELECT
            trip_id,
            activity_date AS date,
            'activity' AS type,
            id::text,
            title AS label,
            start_time AS time,
            cost
        FROM activities
        WHERE activity_date IS NOT NULL

        UNION ALL

        SELECT
            trip_id,
            departure_time::date AS date,
            'flight' AS type,
            id::text,
            origin || ' → ' || destination AS label,
            departure_time::time AS time,
            cost
        FROM flights
        WHERE departure_time IS NOT NULL

        UNION ALL

        SELECT
            trip_id,
            departure_time::date AS date,
            'transport' AS type,
            id::text,
            origin || ' → ' || destination AS label,
            departure_time::time AS time,
            cost
        FROM transports
        WHERE departure_time IS NOT NULL

        UNION ALL

        SELECT
            trip_id,
            check_in AS date,
            'accommodation' AS type,
            id::text,
            name AS label,
            NULL::time AS time,
            cost_per_night AS cost
        FROM accommodations
        WHERE check_in IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS daily_summary")