"""
Integration tests for /trips/{trip_id}/packing_items endpoints.

Key behaviours verified:
- Standard CRUD operations
- `checked` field defaults to False and is NOT settable via create/update
- PATCH /{id}/toggle flips `checked` and is idempotent across two calls
- A PackingItem belongs to exactly one Trip (cross-trip access returns 404)
"""
import pytest
from fastapi.testclient import TestClient


TRIPS = "/trips/"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Packing Test Trip", **kwargs}
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 201
    return response.json()


def _items_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/packing_items/"


def _create_item(client: TestClient, trip_id: str, **kwargs) -> dict:
    payload = {"name": "Passport", **kwargs}
    response = client.post(_items_url(trip_id), json=payload)
    assert response.status_code == 201
    return response.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/packing_items/
# ---------------------------------------------------------------------------

def test_list_items_empty(client):
    trip = _create_trip(client)
    response = client.get(_items_url(trip["id"]))
    assert response.status_code == 200
    # not empty anymore — default items are created on trip creation
    data = response.json()
    assert len(data) == 41  # number of default items


def test_list_items_returns_created_items(client):
    trip = _create_trip(client)
    _create_item(client, trip["id"], name="Passport")
    _create_item(client, trip["id"], name="Sunscreen")

    response = client.get(_items_url(trip["id"]))
    names = [i["name"] for i in response.json()]
    assert "Passport" in names
    assert "Sunscreen" in names


def test_list_items_trip_not_found(client):
    response = client.get(_items_url("00000000-0000-0000-0000-000000000000"))
    assert response.status_code == 404

def test_list_items_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_item(client, trip1["id"], name="Extra item")

    items1 = client.get(_items_url(trip1["id"])).json()
    items2 = client.get(_items_url(trip2["id"])).json()

    # trip1 has default items + 1 extra
    assert len(items1) == 42
    # trip2 has only default items
    assert len(items2) == 41
    # extra item not in trip2
    names2 = [i["name"] for i in items2]
    assert "Extra item" not in names2


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/packing_items/
# ---------------------------------------------------------------------------

def test_create_packing_item_minimal(client):
    trip = _create_trip(client)
    response = client.post(_items_url(trip["id"]), json={"name": "Passport"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Passport"
    assert data["checked"] is False          # default
    assert data["trip_id"] == trip["id"]
    assert "id" in data


def test_create_packing_item_with_category(client):
    trip = _create_trip(client)
    response = client.post(
        _items_url(trip["id"]),
        json={"name": "Passport", "category": "documents"},
    )
    assert response.status_code == 201
    assert response.json()["category"] == "documents"


def test_create_packing_item_with_notes(client):
    trip = _create_trip(client)
    response = client.post(
        _items_url(trip["id"]),
        json={"name": "Adaptor", "notes": "EU plug"},
    )
    assert response.status_code == 201
    assert response.json()["notes"] == "EU plug"


def test_create_packing_item_all_categories(client):
    trip = _create_trip(client)
    for category in ("documents", "clothing", "medicine", "technology", "extras"):
        response = client.post(
            _items_url(trip["id"]),
            json={"name": f"Item {category}", "category": category},
        )
        assert response.status_code == 201, f"Failed for category: {category}"


def test_create_packing_item_invalid_category_rejected(client):
    trip = _create_trip(client)
    response = client.post(
        _items_url(trip["id"]),
        json={"name": "Gadget", "category": "weapons"},
    )
    assert response.status_code == 422


def test_create_packing_item_missing_name_rejected(client):
    trip = _create_trip(client)
    response = client.post(_items_url(trip["id"]), json={"category": "clothing"})
    assert response.status_code == 422


def test_create_packing_item_trip_not_found(client):
    response = client.post(
        _items_url("00000000-0000-0000-0000-000000000000"),
        json={"name": "Passport"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/packing_items/{item_id}
# ---------------------------------------------------------------------------

def test_get_item_by_id(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])
    response = client.get(f"/trips/{trip['id']}/packing_items/{item['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == item["id"]


def test_get_item_not_found(client):
    trip = _create_trip(client)
    response = client.get(
        f"/trips/{trip['id']}/packing_items/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


def test_get_item_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    item = _create_item(client, trip1["id"])
    response = client.get(f"/trips/{trip2['id']}/packing_items/{item['id']}")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/packing_items/{item_id}
# ---------------------------------------------------------------------------

def test_update_packing_item_name(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"], name="Laptop")
    response = client.patch(
        f"/trips/{trip['id']}/packing_items/{item['id']}",
        json={"name": "Laptop + charger"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Laptop + charger"


def test_update_packing_item_category(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])
    response = client.patch(
        f"/trips/{trip['id']}/packing_items/{item['id']}",
        json={"category": "technology"},
    )
    assert response.status_code == 200
    assert response.json()["category"] == "technology"


def test_update_packing_item_does_not_change_checked(client):
    """The update endpoint must not expose `checked` as an editable field."""
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])
    # Even if the client sends `checked`, it should be ignored or rejected
    # (the schema excludes it, so pydantic strips or raises 422).
    response = client.patch(
        f"/trips/{trip['id']}/packing_items/{item['id']}",
        json={"name": "Passport", "checked": True},
    )
    # The field is not in PackingItemUpdate, so either 422 or it is ignored.
    # Either way, we can fetch the item and verify checked is still False.
    if response.status_code == 200:
        assert response.json()["checked"] is False


def test_update_packing_item_not_found(client):
    trip = _create_trip(client)
    response = client.patch(
        f"/trips/{trip['id']}/packing_items/00000000-0000-0000-0000-000000000000",
        json={"name": "Ghost"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/packing_items/{item_id}
# ---------------------------------------------------------------------------

def test_delete_packing_item(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])

    response = client.delete(f"/trips/{trip['id']}/packing_items/{item['id']}")
    assert response.status_code == 204

    response = client.get(f"/trips/{trip['id']}/packing_items/{item['id']}")
    assert response.status_code == 404


def test_delete_packing_item_not_found(client):
    trip = _create_trip(client)
    response = client.delete(
        f"/trips/{trip['id']}/packing_items/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/packing_items/{item_id}/toggle
# ---------------------------------------------------------------------------

def test_toggle_sets_checked_true(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])
    assert item["checked"] is False

    response = client.patch(f"/trips/{trip['id']}/packing_items/{item['id']}/toggle")
    assert response.status_code == 200
    assert response.json()["checked"] is True


def test_toggle_twice_returns_to_false(client):
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])

    client.patch(f"/trips/{trip['id']}/packing_items/{item['id']}/toggle")
    response = client.patch(f"/trips/{trip['id']}/packing_items/{item['id']}/toggle")
    assert response.status_code == 200
    assert response.json()["checked"] is False


def test_toggle_persists(client):
    """After toggling, a GET must reflect the updated state."""
    trip = _create_trip(client)
    item = _create_item(client, trip["id"])

    client.patch(f"/trips/{trip['id']}/packing_items/{item['id']}/toggle")

    response = client.get(f"/trips/{trip['id']}/packing_items/{item['id']}")
    assert response.json()["checked"] is True


def test_toggle_item_not_found(client):
    trip = _create_trip(client)
    response = client.patch(
        f"/trips/{trip['id']}/packing_items/00000000-0000-0000-0000-000000000000/toggle"
    )
    assert response.status_code == 404
