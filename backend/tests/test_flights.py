"""
Integration tests for /trips/{trip_id}/flights endpoints.

Key behaviours verified:
- Standard CRUD operations
- A Flight belongs to exactly one Trip (cross-trip access returns 404)
- Status field accepts only valid enum values
- arrival_time must be after departure_time when both are provided
- Deleting a Trip cascades and removes its Flights
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"
VALID_STATUSES = ("draft", "to_book", "booked", "cancelled", "completed")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Flight Test Trip", "start_date": "2025-07-01", "end_date": "2025-07-15", **kwargs}
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _flights_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/flights/"


def _create_flight(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {
        "flight_number": "AZ610",
        "origin": "FCO",
        "destination": "JFK",
        **kwargs,
    }
    r = client.post(_flights_url(trip_id), json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/flights/
# ---------------------------------------------------------------------------

def test_list_flights_empty(client):
    trip = _create_trip(client)
    r = client.get(_flights_url(trip["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_flights_returns_created(client):
    trip = _create_trip(client)
    _create_flight(client, trip["id"], flight_number="AZ610")
    _create_flight(client, trip["id"], flight_number="BA456")

    r = client.get(_flights_url(trip["id"]))
    assert r.status_code == 200
    numbers = [f["flight_number"] for f in r.json()]
    assert "AZ610" in numbers
    assert "BA456" in numbers


def test_list_flights_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/flights/")
    assert r.status_code == 404


def test_list_flights_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_flight(client, trip1["id"])

    r = client.get(_flights_url(trip2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/flights/
# ---------------------------------------------------------------------------

def test_create_flight_minimal(client):
    trip = _create_trip(client)
    r = client.post(
        _flights_url(trip["id"]),
        json={"flight_number": "AZ610", "origin": "FCO", "destination": "JFK"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["flight_number"] == "AZ610"
    assert data["origin"] == "FCO"
    assert data["destination"] == "JFK"
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_flight_full(client):
    trip = _create_trip(client)
    payload = {
        "flight_number": "AZ610",
        "origin": "FCO",
        "destination": "JFK",
        "departure_time": "2025-09-01T08:00:00",
        "arrival_time": "2025-09-01T14:00:00",
        "airline": "Alitalia",
        "cost": 450.0,
        "status": "booked",
        "notes": "Window seat",
        "booking_reference": "XYZ123",
    }
    r = client.post(_flights_url(trip["id"]), json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["airline"] == "Alitalia"
    assert data["cost"] == 450.0
    assert data["status"] == "booked"
    assert data["booking_reference"] == "XYZ123"


def test_create_flight_all_valid_statuses(client):
    trip = _create_trip(client)
    for status in VALID_STATUSES:
        r = client.post(
            _flights_url(trip["id"]),
            json={
                "flight_number": f"AZ{status[:3].upper()}",
                "origin": "FCO",
                "destination": "JFK",
                "status": status,
            },
        )
        assert r.status_code == 201, f"Failed for status: {status}"


def test_create_flight_invalid_status_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _flights_url(trip["id"]),
        json={"flight_number": "AZ610", "origin": "FCO", "destination": "JFK", "status": "flying"},
    )
    assert r.status_code == 422


def test_create_flight_arrival_before_departure_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _flights_url(trip["id"]),
        json={
            "flight_number": "AZ610",
            "origin": "FCO",
            "destination": "JFK",
            "departure_time": "2025-09-01T14:00:00",
            "arrival_time": "2025-09-01T08:00:00",  # before departure
        },
    )
    assert r.status_code == 422


def test_create_flight_negative_cost_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _flights_url(trip["id"]),
        json={"flight_number": "AZ610", "origin": "FCO", "destination": "JFK", "cost": -50.0},
    )
    assert r.status_code == 422


def test_create_flight_missing_required_fields_rejected(client):
    trip = _create_trip(client)
    # missing origin and destination
    r = client.post(_flights_url(trip["id"]), json={"flight_number": "AZ610"})
    assert r.status_code == 422


def test_create_flight_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(
        f"/trips/{fake}/flights/",
        json={"flight_number": "AZ610", "origin": "FCO", "destination": "JFK"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/flights/{flight_id}
# ---------------------------------------------------------------------------

def test_get_flight_by_id(client):
    trip = _create_trip(client)
    flight = _create_flight(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/flights/{flight['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == flight["id"]


def test_get_flight_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/flights/{fake}")
    assert r.status_code == 404


def test_get_flight_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    flight = _create_flight(client, trip1["id"])
    r = client.get(f"/trips/{trip2['id']}/flights/{flight['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/flights/{flight_id}
# ---------------------------------------------------------------------------

def test_update_flight_status(client):
    trip = _create_trip(client)
    flight = _create_flight(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/flights/{flight['id']}",
        json={"status": "booked"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "booked"


def test_update_flight_partial_keeps_other_fields(client):
    trip = _create_trip(client)
    flight = _create_flight(client, trip["id"], airline="Alitalia")
    r = client.patch(
        f"/trips/{trip['id']}/flights/{flight['id']}",
        json={"notes": "Aisle seat"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["airline"] == "Alitalia"   # unchanged
    assert data["notes"] == "Aisle seat"   # updated


def test_update_flight_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(f"/trips/{trip['id']}/flights/{fake}", json={"notes": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/flights/{flight_id}
# ---------------------------------------------------------------------------

def test_delete_flight(client):
    trip = _create_trip(client)
    flight = _create_flight(client, trip["id"])

    r = client.delete(f"/trips/{trip['id']}/flights/{flight['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/flights/{flight['id']}")
    assert r.status_code == 404


def test_delete_flight_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/flights/{fake}")
    assert r.status_code == 404


def test_delete_trip_cascades_to_flights(client):
    trip = _create_trip(client)
    flight = _create_flight(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(f"/trips/{trip['id']}/flights/{flight['id']}").status_code == 404