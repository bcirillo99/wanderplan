"""
Integration tests for /trips/{trip_id}/days endpoints.

Key behaviours verified:
- Standard CRUD operations
- A Day's date must fall within the parent Trip's date range (400 otherwise)
- A Day belongs to exactly one Trip (cross-trip access returns 404)
- Deleting a Trip cascades and removes its Days
"""
import pytest
from fastapi.testclient import TestClient


TRIPS = "/trips/"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {
        "title": "Test Trip",
        "start_date": "2025-06-01",
        "end_date": "2025-06-30",
        **kwargs,
    }
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 201
    return response.json()


def _days_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/days/"


def _create_day(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {"day_date": "2025-06-10", **kwargs}
    response = client.post(_days_url(trip_id), json=payload)
    assert response.status_code == 201
    return response.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/days/
# ---------------------------------------------------------------------------

def test_list_days_empty(client):
    trip = _create_trip(client)
    response = client.get(_days_url(trip["id"]))
    assert response.status_code == 200
    assert response.json() == []


def test_list_days_returns_created_days(client):
    trip = _create_trip(client)
    _create_day(client, trip["id"], day_date="2025-06-05")
    _create_day(client, trip["id"], day_date="2025-06-10")

    response = client.get(_days_url(trip["id"]))
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_days_trip_not_found(client):
    response = client.get(_days_url("00000000-0000-0000-0000-000000000000"))
    assert response.status_code == 404


def test_list_days_isolated_per_trip(client):
    """Days from another trip must not appear in the listing."""
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_day(client, trip1["id"])

    response = client.get(_days_url(trip2["id"]))
    assert response.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/days/
# ---------------------------------------------------------------------------

def test_create_day(client):
    trip = _create_trip(client)
    response = client.post(_days_url(trip["id"]), json={"day_date": "2025-06-10"})
    assert response.status_code == 201
    data = response.json()
    assert data["day_date"] == "2025-06-10"
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_day_with_location_and_notes(client):
    trip = _create_trip(client)
    response = client.post(
        _days_url(trip["id"]),
        json={"day_date": "2025-06-10", "location": "Florence", "notes": "Visit Uffizi"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["location"] == "Florence"
    assert data["notes"] == "Visit Uffizi"


def test_create_day_on_trip_start_date(client):
    trip = _create_trip(client)
    response = client.post(_days_url(trip["id"]), json={"day_date": "2025-06-01"})
    assert response.status_code == 201


def test_create_day_on_trip_end_date(client):
    trip = _create_trip(client)
    response = client.post(_days_url(trip["id"]), json={"day_date": "2025-06-30"})
    assert response.status_code == 201


def test_create_day_before_trip_start_rejected(client):
    trip = _create_trip(client)  # start_date: 2025-06-01
    response = client.post(_days_url(trip["id"]), json={"day_date": "2025-05-31"})
    assert response.status_code == 400


def test_create_day_after_trip_end_rejected(client):
    trip = _create_trip(client)  # end_date: 2025-06-30
    response = client.post(_days_url(trip["id"]), json={"day_date": "2025-07-01"})
    assert response.status_code == 400


def test_create_day_trip_without_dates_allows_any_date(client):
    """When the trip has no start/end date, no date validation is applied."""
    trip = _create_trip(client, start_date=None, end_date=None)
    response = client.post(_days_url(trip["id"]), json={"day_date": "2099-01-01"})
    assert response.status_code == 201


def test_create_day_trip_not_found(client):
    response = client.post(
        _days_url("00000000-0000-0000-0000-000000000000"),
        json={"day_date": "2025-06-10"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/days/{day_id}
# ---------------------------------------------------------------------------

def test_get_day_by_id(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    response = client.get(f"/trips/{trip['id']}/days/{day['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == day["id"]


def test_get_day_not_found(client):
    trip = _create_trip(client)
    response = client.get(f"/trips/{trip['id']}/days/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_get_day_wrong_trip_returns_404(client):
    """A day that belongs to trip1 must not be accessible via trip2's URL."""
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    day = _create_day(client, trip1["id"])
    response = client.get(f"/trips/{trip2['id']}/days/{day['id']}")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/days/{day_id}
# ---------------------------------------------------------------------------

def test_update_day_location(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    response = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}",
        json={"location": "Siena"},
    )
    assert response.status_code == 200
    assert response.json()["location"] == "Siena"


def test_update_day_date_within_range(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    response = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}",
        json={"day_date": "2025-06-20"},
    )
    assert response.status_code == 200
    assert response.json()["day_date"] == "2025-06-20"


def test_update_day_date_out_of_range_rejected(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    response = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}",
        json={"day_date": "2025-08-01"},  # after trip end
    )
    assert response.status_code == 400


def test_update_day_not_found(client):
    trip = _create_trip(client)
    response = client.patch(
        f"/trips/{trip['id']}/days/00000000-0000-0000-0000-000000000000",
        json={"location": "Nowhere"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/days/{day_id}
# ---------------------------------------------------------------------------

def test_delete_day(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])

    response = client.delete(f"/trips/{trip['id']}/days/{day['id']}")
    assert response.status_code == 204

    # Confirm it is gone
    response = client.get(f"/trips/{trip['id']}/days/{day['id']}")
    assert response.status_code == 404


def test_delete_day_not_found(client):
    trip = _create_trip(client)
    response = client.delete(
        f"/trips/{trip['id']}/days/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


def test_delete_trip_cascades_to_days(client):
    """Deleting a Trip must also remove all its Days (CASCADE)."""
    trip = _create_trip(client)
    _create_day(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    # The trip itself is gone
    assert client.get(f"/trips/{trip['id']}").status_code == 404
    # The days listing endpoint returns 404 (trip not found)
    assert client.get(_days_url(trip["id"])).status_code == 404
