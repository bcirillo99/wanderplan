"""
Integration tests for /trips/{trip_id}/accommodations endpoints.

Key behaviours verified:
- Standard CRUD operations
- AccommodationType enum validation
- check_out must be on or after check_in when both are provided
- extra_details JSONB field stores and retrieves arbitrary dicts
- A Accommodation belongs to exactly one Trip (cross-trip access returns 404)
- Deleting a Trip cascades and removes its Accommodations
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"
VALID_STATUSES = ("draft", "to_book", "booked", "cancelled", "completed")
# Adjust to match your AccommodationType enum
VALID_ACCOMMODATION_TYPES = ("hotel", "airbnb", "hostel", "resort", "other")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Accommodation Test Trip", "start_date": "2025-07-01", "end_date": "2025-07-15", **kwargs}
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _accommodations_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/accommodations/"


def _create_accommodation(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {
        "name": "Hotel Roma",
        "accommodation_type": "hotel",
        **kwargs,
    }
    r = client.post(_accommodations_url(trip_id), json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/accommodations/
# ---------------------------------------------------------------------------

def test_list_accommodations_empty(client):
    trip = _create_trip(client)
    r = client.get(_accommodations_url(trip["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_accommodations_returns_created(client):
    trip = _create_trip(client)
    _create_accommodation(client, trip["id"], name="Hotel Roma")
    _create_accommodation(client, trip["id"], name="Airbnb Florence")

    r = client.get(_accommodations_url(trip["id"]))
    assert r.status_code == 200
    names = [a["name"] for a in r.json()]
    assert "Hotel Roma" in names
    assert "Airbnb Florence" in names


def test_list_accommodations_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/accommodations/")
    assert r.status_code == 404


def test_list_accommodations_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_accommodation(client, trip1["id"])

    r = client.get(_accommodations_url(trip2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/accommodations/
# ---------------------------------------------------------------------------

def test_create_accommodation_minimal(client):
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={"name": "Hotel Roma", "accommodation_type": "hotel"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Hotel Roma"
    assert data["accommodation_type"] == "hotel"
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_accommodation_full(client):
    trip = _create_trip(client)
    payload = {
        "name": "Grand Hotel Florence",
        "accommodation_type": "hotel",
        "address": "Via dei Fiori 10, Florence",
        "check_in": "2025-09-01",
        "check_out": "2025-09-05",
        "cost_per_night": 150.0,
        "status": "booked",
        "booking_reference": "GHF2025",
        "notes": "Early check-in requested",
    }
    r = client.post(_accommodations_url(trip["id"]), json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["address"] == "Via dei Fiori 10, Florence"
    assert data["cost_per_night"] == 150.0
    assert data["booking_reference"] == "GHF2025"
    assert data["status"] == "booked"


def test_create_accommodation_with_extra_details(client):
    trip = _create_trip(client)
    extra = {"airbnb_code": "ABC123", "host_name": "Marco", "wifi_password": "secret"}
    r = client.post(
        _accommodations_url(trip["id"]),
        json={"name": "Cosy Apartment", "accommodation_type": "airbnb", "extra_details": extra},
    )
    assert r.status_code == 201
    assert r.json()["extra_details"] == extra


def test_create_accommodation_all_valid_types(client):
    trip = _create_trip(client)
    for acc_type in VALID_ACCOMMODATION_TYPES:
        r = client.post(
            _accommodations_url(trip["id"]),
            json={"name": f"Place {acc_type}", "accommodation_type": acc_type},
        )
        assert r.status_code == 201, f"Failed for accommodation_type: {acc_type}"


def test_create_accommodation_invalid_type_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={"name": "Tent", "accommodation_type": "campsite"},
    )
    assert r.status_code == 422


def test_create_accommodation_check_out_before_check_in_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={
            "name": "Hotel Roma",
            "accommodation_type": "hotel",
            "check_in": "2025-09-10",
            "check_out": "2025-09-05",  # before check-in
        },
    )
    assert r.status_code == 422


def test_create_accommodation_same_check_in_check_out(client):
    """Same-day check-in/check-out (day use) should be allowed."""
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={
            "name": "Day Use Hotel",
            "accommodation_type": "hotel",
            "check_in": "2025-09-01",
            "check_out": "2025-09-01",
        },
    )
    assert r.status_code == 201


def test_create_accommodation_negative_cost_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={"name": "Hotel", "accommodation_type": "hotel", "cost_per_night": -10.0},
    )
    assert r.status_code == 422


def test_create_accommodation_missing_name_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _accommodations_url(trip["id"]),
        json={"accommodation_type": "hotel"},
    )
    assert r.status_code == 422


def test_create_accommodation_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(
        f"/trips/{fake}/accommodations/",
        json={"name": "Ghost Hotel", "accommodation_type": "hotel"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/accommodations/{accommodation_id}
# ---------------------------------------------------------------------------

def test_get_accommodation_by_id(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/accommodations/{acc['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == acc["id"]


def test_get_accommodation_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/accommodations/{fake}")
    assert r.status_code == 404


def test_get_accommodation_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    acc = _create_accommodation(client, trip1["id"])
    r = client.get(f"/trips/{trip2['id']}/accommodations/{acc['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/accommodations/{accommodation_id}
# ---------------------------------------------------------------------------

def test_update_accommodation_status(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/accommodations/{acc['id']}",
        json={"status": "booked"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "booked"


def test_update_accommodation_extra_details(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"])
    new_extra = {"wifi": "GuestNet", "password": "12345678"}
    r = client.patch(
        f"/trips/{trip['id']}/accommodations/{acc['id']}",
        json={"extra_details": new_extra},
    )
    assert r.status_code == 200
    assert r.json()["extra_details"] == new_extra


def test_update_accommodation_partial_keeps_other_fields(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"], name="Grand Hotel")
    r = client.patch(
        f"/trips/{trip['id']}/accommodations/{acc['id']}",
        json={"notes": "Late checkout"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Grand Hotel"      # unchanged
    assert data["notes"] == "Late checkout"   # updated


def test_update_accommodation_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(f"/trips/{trip['id']}/accommodations/{fake}", json={"notes": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/accommodations/{accommodation_id}
# ---------------------------------------------------------------------------

def test_delete_accommodation(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"])

    r = client.delete(f"/trips/{trip['id']}/accommodations/{acc['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/accommodations/{acc['id']}")
    assert r.status_code == 404


def test_delete_accommodation_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/accommodations/{fake}")
    assert r.status_code == 404


def test_delete_trip_cascades_to_accommodations(client):
    trip = _create_trip(client)
    acc = _create_accommodation(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(f"/trips/{trip['id']}/accommodations/{acc['id']}").status_code == 404