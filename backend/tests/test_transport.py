"""
Integration tests for /trips/{trip_id}/transports endpoints.

Key behaviours verified:
- Standard CRUD operations
- Transport type enum validation
- extra_details JSONB field stores and retrieves arbitrary dicts
- A Transport belongs to exactly one Trip (cross-trip access returns 404)
- Deleting a Trip cascades and removes its Transports
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"
VALID_STATUSES = ("draft", "to_book", "booked", "cancelled", "completed")
# Adjust this list to match your TransportType enum
VALID_TRANSPORT_TYPES = ("train", "bus", "car", "ferry", "taxi", "other")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Transport Test Trip", "start_date": "2025-07-01", "end_date": "2025-07-15", **kwargs}
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _transports_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/transports/"


def _create_transport(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {
        "transport_type": "train",
        "origin": "Milan",
        "destination": "Rome",
        **kwargs,
    }
    r = client.post(_transports_url(trip_id), json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/transports/
# ---------------------------------------------------------------------------

def test_list_transports_empty(client):
    trip = _create_trip(client)
    r = client.get(_transports_url(trip["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_transports_returns_created(client):
    trip = _create_trip(client)
    _create_transport(client, trip["id"], origin="Milan", destination="Rome")
    _create_transport(client, trip["id"], origin="Rome", destination="Naples")

    r = client.get(_transports_url(trip["id"]))
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_list_transports_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/transports/")
    assert r.status_code == 404


def test_list_transports_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_transport(client, trip1["id"])

    r = client.get(_transports_url(trip2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/transports/
# ---------------------------------------------------------------------------

def test_create_transport_minimal(client):
    trip = _create_trip(client)
    r = client.post(
        _transports_url(trip["id"]),
        json={"transport_type": "train", "origin": "Milan", "destination": "Rome"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["transport_type"] == "train"
    assert data["origin"] == "Milan"
    assert data["destination"] == "Rome"
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_transport_full(client):
    trip = _create_trip(client)
    payload = {
        "transport_type": "train",
        "origin": "Milan Centrale",
        "destination": "Roma Termini",
        "departure_time": "2025-09-01T09:00:00",
        "arrival_time": "2025-09-01T12:30:00",
        "operator": "Trenitalia",
        "cost": 89.0,
        "status": "booked",
        "notes": "Seat 14A",
        "booking_reference": "ITA987",
    }
    r = client.post(_transports_url(trip["id"]), json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["operator"] == "Trenitalia"
    assert data["cost"] == 89.0
    assert data["booking_reference"] == "ITA987"


def test_create_transport_with_extra_details(client):
    trip = _create_trip(client)
    extra = {"train_number": "FR9600", "carriage": "5", "seat": "14A"}
    r = client.post(
        _transports_url(trip["id"]),
        json={
            "transport_type": "train",
            "origin": "Milan",
            "destination": "Rome",
            "extra_details": extra,
        },
    )
    assert r.status_code == 201
    assert r.json()["extra_details"] == extra


def test_create_transport_extra_details_arbitrary_keys(client):
    """extra_details is freeform JSONB — any dict should be accepted."""
    trip = _create_trip(client)
    extra = {"custom_key": "custom_value", "nested": {"deep": True}}
    r = client.post(
        _transports_url(trip["id"]),
        json={
            "transport_type": "car",
            "origin": "Florence",
            "destination": "Siena",
            "extra_details": extra,
        },
    )
    assert r.status_code == 201
    assert r.json()["extra_details"] == extra


def test_create_transport_all_valid_types(client):
    trip = _create_trip(client)
    for t_type in VALID_TRANSPORT_TYPES:
        r = client.post(
            _transports_url(trip["id"]),
            json={"transport_type": t_type, "origin": "A", "destination": "B"},
        )
        assert r.status_code == 201, f"Failed for transport_type: {t_type}"


def test_create_transport_invalid_type_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _transports_url(trip["id"]),
        json={"transport_type": "teleport", "origin": "A", "destination": "B"},
    )
    assert r.status_code == 422


def test_create_transport_arrival_before_departure_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _transports_url(trip["id"]),
        json={
            "transport_type": "train",
            "origin": "Milan",
            "destination": "Rome",
            "departure_time": "2025-09-01T12:00:00",
            "arrival_time": "2025-09-01T09:00:00",
        },
    )
    assert r.status_code == 422


def test_create_transport_negative_cost_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _transports_url(trip["id"]),
        json={"transport_type": "bus", "origin": "A", "destination": "B", "cost": -5.0},
    )
    assert r.status_code == 422


def test_create_transport_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(
        f"/trips/{fake}/transports/",
        json={"transport_type": "train", "origin": "A", "destination": "B"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/transports/{transport_id}
# ---------------------------------------------------------------------------

def test_get_transport_by_id(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/transports/{transport['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == transport["id"]


def test_get_transport_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/transports/{fake}")
    assert r.status_code == 404


def test_get_transport_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    transport = _create_transport(client, trip1["id"])
    r = client.get(f"/trips/{trip2['id']}/transports/{transport['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/transports/{transport_id}
# ---------------------------------------------------------------------------

def test_update_transport_status(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/transports/{transport['id']}",
        json={"status": "booked"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "booked"


def test_update_transport_extra_details(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"])
    new_extra = {"seat": "22B", "wagon": "3"}
    r = client.patch(
        f"/trips/{trip['id']}/transports/{transport['id']}",
        json={"extra_details": new_extra},
    )
    assert r.status_code == 200
    assert r.json()["extra_details"] == new_extra


def test_update_transport_partial_keeps_other_fields(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"], operator="Trenitalia")
    r = client.patch(
        f"/trips/{trip['id']}/transports/{transport['id']}",
        json={"notes": "Left luggage"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["operator"] == "Trenitalia"     # unchanged
    assert data["notes"] == "Left luggage"      # updated


def test_update_transport_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(f"/trips/{trip['id']}/transports/{fake}", json={"notes": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/transports/{transport_id}
# ---------------------------------------------------------------------------

def test_delete_transport(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"])

    r = client.delete(f"/trips/{trip['id']}/transports/{transport['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/transports/{transport['id']}")
    assert r.status_code == 404


def test_delete_transport_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/transports/{fake}")
    assert r.status_code == 404


def test_delete_trip_cascades_to_transports(client):
    trip = _create_trip(client)
    transport = _create_transport(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(f"/trips/{trip['id']}/transports/{transport['id']}").status_code == 404