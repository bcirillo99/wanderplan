# backend/tests/test_stats.py
"""
Integration tests for /trips/{trip_id}/stats and /trips/{trip_id}/days/{day_id}/stats endpoints.
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"


def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {
        "title": "Stats Test Trip",
        "start_date": "2025-08-01",
        "end_date": "2025-08-31",
        **kwargs,
    }
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _create_day(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {"day_date": "2025-08-10", **kwargs}
    r = client.post(f"/trips/{trip_id}/days/", json=payload)
    assert r.status_code == 201
    return r.json()


def _create_flight(client: TestClient, trip_id: str, cost: float) -> dict:
    r = client.post(f"/trips/{trip_id}/flights/", json={
        "origin": "FCO",
        "destination": "JFK",
        "cost": cost,
    })
    assert r.status_code == 201
    return r.json()


def _create_activity(client: TestClient, trip_id: str, day_id: str, cost: float) -> dict:
    r = client.post(f"/trips/{trip_id}/days/{day_id}/activities/", json={
        "title": "Test Activity",
        "cost": cost,
    })
    assert r.status_code == 201
    return r.json()


def _create_accommodation(client: TestClient, trip_id: str, cost_per_night: float) -> dict:
    r = client.post(f"/trips/{trip_id}/accommodations/", json={
        "name": "Test Hotel",
        "accommodation_type": "hotel",
        "check_in": "2025-08-10",
        "check_out": "2025-08-12",
        "cost_per_night": cost_per_night,
    })
    assert r.status_code == 201
    return r.json()


def _create_transport(client: TestClient, trip_id: str, cost: float) -> dict:
    r = client.post(f"/trips/{trip_id}/transports/", json={
        "transport_type": "train",
        "origin": "Milan",
        "destination": "Rome",
        "cost": cost,
    })
    assert r.status_code == 201
    return r.json()


def _create_expense(client: TestClient, trip_id: str, amount: float) -> dict:
    r = client.post(f"/trips/{trip_id}/expenses/", json={
        "description": "Test Expense",
        "amount": amount,
        "category": "other",
    })
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/stats
# ---------------------------------------------------------------------------

def test_trip_stats_empty(client):
    trip = _create_trip(client)
    r = client.get(f"/trips/{trip['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["flights"] == 0
    assert data["transport"] == 0
    assert data["accommodation"] == 0
    assert data["activities"] == 0
    assert data["expenses"] == 0


def test_trip_stats_with_flight(client):
    trip = _create_trip(client)
    _create_flight(client, trip["id"], cost=500.0)
    r = client.get(f"/trips/{trip['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["flights"] == 500.0
    assert data["total"] == 500.0


def test_trip_stats_with_accommodation(client):
    trip = _create_trip(client)
    _create_accommodation(client, trip["id"], cost_per_night=100.0)
    r = client.get(f"/trips/{trip['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["accommodation"] == 200.0  # 100 x 2 notti
    assert data["total"] == 200.0


def test_trip_stats_with_all_categories(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    _create_flight(client, trip["id"], cost=500.0)
    _create_transport(client, trip["id"], cost=50.0)
    _create_accommodation(client, trip["id"], cost_per_night=100.0)
    _create_activity(client, trip["id"], day["id"], cost=30.0)
    _create_expense(client, trip["id"], amount=20.0)

    r = client.get(f"/trips/{trip['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["flights"] == 500.0
    assert data["transport"] == 50.0
    assert data["accommodation"] == 200.0  # 100 x 2 notti
    assert data["activities"] == 30.0
    assert data["expenses"] == 20.0
    assert data["total"] == 800.0


def test_trip_stats_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/stats")
    assert r.status_code == 404


def test_trip_stats_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_flight(client, trip1["id"], cost=500.0)

    r = client.get(f"/trips/{trip2['id']}/stats")
    assert r.json()["total"] == 0


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/days/{day_id}/stats
# ---------------------------------------------------------------------------

def test_day_stats_empty(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["activities"] == 0


def test_day_stats_with_activities(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    _create_activity(client, trip["id"], day["id"], cost=25.0)
    _create_activity(client, trip["id"], day["id"], cost=15.0)

    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["activities"] == 40.0
    assert data["total"] == 40.0


def test_day_stats_isolated_per_day(client):
    trip = _create_trip(client)
    day1 = _create_day(client, trip["id"], day_date="2025-08-10")
    day2 = _create_day(client, trip["id"], day_date="2025-08-11")
    _create_activity(client, trip["id"], day1["id"], cost=50.0)

    r = client.get(f"/trips/{trip['id']}/days/{day2['id']}/stats")
    assert r.json()["total"] == 0


def test_day_stats_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/days/{fake}/stats")
    assert r.status_code == 404


def test_day_stats_day_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/days/{fake}/stats")
    assert r.status_code == 404