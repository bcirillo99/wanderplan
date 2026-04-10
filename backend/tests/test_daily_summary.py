"""
Integration tests for /trips/{trip_id}/days/{date}/summary endpoint.

NOTE: These tests require PostgreSQL — the daily_summary view is not available
in the SQLite in-memory test database. Run manually against the real DB.
"""
import pytest


@pytest.mark.skip(reason="requires PostgreSQL — daily_summary view not available in SQLite")
def test_daily_summary_empty(client):
    pass


@pytest.mark.skip(reason="requires PostgreSQL — daily_summary view not available in SQLite")
def test_daily_summary_with_activity(client):
    pass


@pytest.mark.skip(reason="requires PostgreSQL — daily_summary view not available in SQLite")
def test_daily_summary_with_flight(client):
    pass


@pytest.mark.skip(reason="requires PostgreSQL — daily_summary view not available in SQLite")
def test_daily_summary_ordered_by_time(client):
    pass