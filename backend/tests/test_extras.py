"""
Integration tests for /trips/{trip_id}/extras endpoints.

Key behaviours verified:
- Standard CRUD operations
- amount must be positive
- category enum validation
- estimated vs actual amount tracking
- An Extra belongs to exactly one Trip (cross-trip access returns 404)
- Deleting a Trip cascades and removes its Extras
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"
VALID_CATEGORIES = (
    "transport",
    "accommodation",
    "food",
    "activities",
    "shopping",
    "other",
)


def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Extra Test Trip", "start_date": "2025-07-01", "end_date": "2025-07-15", **kwargs}
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _extras_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/extras/"


def _create_extra(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {
        "description": "Dinner",
        "amount": 45.0,
        "category": "food",
        **kwargs,
    }
    r = client.post(_extras_url(trip_id), json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/extras/
# ---------------------------------------------------------------------------

def test_list_extras_empty(client):
    trip = _create_trip(client)
    r = client.get(_extras_url(trip["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_extras_returns_created(client):
    trip = _create_trip(client)
    _create_extra(client, trip["id"], description="Dinner")
    _create_extra(client, trip["id"], description="Museum ticket")

    r = client.get(_extras_url(trip["id"]))
    assert r.status_code == 200
    descriptions = [e["description"] for e in r.json()]
    assert "Dinner" in descriptions
    assert "Museum ticket" in descriptions


def test_list_extras_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/extras/")
    assert r.status_code == 404


def test_list_extras_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_extra(client, trip1["id"])

    r = client.get(_extras_url(trip2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/extras/
# ---------------------------------------------------------------------------

def test_create_extra_minimal(client):
    trip = _create_trip(client)
    r = client.post(
        _extras_url(trip["id"]),
        json={"description": "Coffee", "amount": 3.5, "category": "food"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["description"] == "Coffee"
    assert data["amount"] == 3.5
    assert data["category"] == "food"
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_extra_full(client):
    trip = _create_trip(client)
    payload = {
        "description": "Train Milan-Rome",
        "amount": 89.0,
        "category": "transport",
        "is_estimated": False,
        "currency": "EUR",
        "notes": "Frecciarossa",
    }
    r = client.post(_extras_url(trip["id"]), json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["currency"] == "EUR"
    assert data["is_estimated"] is False
    assert data["notes"] == "Frecciarossa"


def test_create_extra_estimated(client):
    trip = _create_trip(client)
    r = client.post(
        _extras_url(trip["id"]),
        json={"description": "Taxi", "amount": 20.0, "category": "transport", "is_estimated": True},
    )
    assert r.status_code == 201
    assert r.json()["is_estimated"] is True


def test_create_extra_all_valid_categories(client):
    trip = _create_trip(client)
    for category in VALID_CATEGORIES:
        r = client.post(
            _extras_url(trip["id"]),
            json={"description": f"Extra {category}", "amount": 10.0, "category": category},
        )
        assert r.status_code == 201, f"Failed for category: {category}"


def test_create_extra_invalid_category_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _extras_url(trip["id"]),
        json={"description": "Mystery", "amount": 10.0, "category": "luxury"},
    )
    assert r.status_code == 422


def test_create_extra_zero_amount_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _extras_url(trip["id"]),
        json={"description": "Free?", "amount": 0.0, "category": "other"},
    )
    assert r.status_code == 422


def test_create_extra_negative_amount_rejected(client):
    trip = _create_trip(client)
    r = client.post(
        _extras_url(trip["id"]),
        json={"description": "Refund?", "amount": -15.0, "category": "other"},
    )
    assert r.status_code == 422


def test_create_extra_missing_required_fields_rejected(client):
    trip = _create_trip(client)
    r = client.post(_extras_url(trip["id"]), json={"description": "Incomplete"})
    assert r.status_code == 422


def test_create_extra_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(
        f"/trips/{fake}/extras/",
        json={"description": "Ghost", "amount": 10.0, "category": "other"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/extras/{extra_id}
# ---------------------------------------------------------------------------

def test_get_extra_by_id(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/extras/{extra['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == extra["id"]


def test_get_extra_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/extras/{fake}")
    assert r.status_code == 404


def test_get_extra_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    extra = _create_extra(client, trip1["id"])
    r = client.get(f"/trips/{trip2['id']}/extras/{extra['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/extras/{extra_id}
# ---------------------------------------------------------------------------

def test_update_extra_amount(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"], amount=30.0)
    r = client.patch(
        f"/trips/{trip['id']}/extras/{extra['id']}",
        json={"amount": 35.5},
    )
    assert r.status_code == 200
    assert r.json()["amount"] == 35.5


def test_update_extra_category(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/extras/{extra['id']}",
        json={"category": "activities"},
    )
    assert r.status_code == 200
    assert r.json()["category"] == "activities"


def test_update_extra_mark_as_actual(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/extras/{extra['id']}",
        json={"is_estimated": False},
    )
    assert r.status_code == 200
    assert r.json()["is_estimated"] is False


def test_update_extra_partial_keeps_other_fields(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"], description="Dinner", amount=60.0)
    r = client.patch(
        f"/trips/{trip['id']}/extras/{extra['id']}",
        json={"notes": "Trattoria"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["description"] == "Dinner"
    assert data["amount"] == 60.0
    assert data["notes"] == "Trattoria"


def test_update_extra_negative_amount_rejected(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])
    r = client.patch(
        f"/trips/{trip['id']}/extras/{extra['id']}",
        json={"amount": -5.0},
    )
    assert r.status_code == 422


def test_update_extra_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(f"/trips/{trip['id']}/extras/{fake}", json={"amount": 99.0})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/extras/{extra_id}
# ---------------------------------------------------------------------------

def test_delete_extra(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])

    r = client.delete(f"/trips/{trip['id']}/extras/{extra['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/extras/{extra['id']}")
    assert r.status_code == 404


def test_delete_extra_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/extras/{fake}")
    assert r.status_code == 404


def test_delete_trip_cascades_to_extras(client):
    trip = _create_trip(client)
    extra = _create_extra(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(f"/trips/{trip['id']}/extras/{extra['id']}").status_code == 404
