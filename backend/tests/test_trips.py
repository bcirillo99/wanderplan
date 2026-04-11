"""
Integration tests for /trips endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from travel_planner.services.trip_service import DEFAULT_PACKING_ITEMS



TRIPS = "/trips/"


def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Test Trip", **kwargs}
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 201
    return response.json()


# ---------------------------------------------------------------------------
# GET /trips/
# ---------------------------------------------------------------------------

def test_list_trips_empty(client):
    response = client.get(TRIPS)
    assert response.status_code == 200
    assert response.json() == []


def test_list_trips_returns_all(client):
    _create_trip(client, title="Paris Trip")
    _create_trip(client, title="Tokyo Trip")

    response = client.get(TRIPS)
    assert response.status_code == 200
    titles = [t["title"] for t in response.json()]
    assert "Paris Trip" in titles
    assert "Tokyo Trip" in titles


# ---------------------------------------------------------------------------
# POST /trips/
# ---------------------------------------------------------------------------

def test_create_trip_minimal(client):
    response = client.post(TRIPS, json={"title": "My Trip"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My Trip"
    assert "id" in data


def test_create_trip_full(client):
    payload = {
        "title": "Summer in Italy",
        "description": "Two weeks exploring Tuscany",
        "start_date": "2025-07-01",
        "end_date": "2025-07-15",
        "destination": "Florence, Italy",
    }
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Summer in Italy"
    assert data["destination"] == "Florence, Italy"
    assert data["start_date"] == "2025-07-01"
    assert data["end_date"] == "2025-07-15"


def test_create_trip_end_before_start_rejected(client):
    payload = {
        "title": "Bad Dates",
        "start_date": "2025-07-15",
        "end_date": "2025-07-01",  # before start
    }
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 422


def test_create_trip_same_start_end_date(client):
    payload = {
        "title": "Day Trip",
        "start_date": "2025-07-01",
        "end_date": "2025-07-01",
    }
    response = client.post(TRIPS, json=payload)
    assert response.status_code == 201


def test_create_trip_missing_title_rejected(client):
    response = client.post(TRIPS, json={"description": "No title here"})
    assert response.status_code == 422


def test_create_trip_generates_default_packing_items(client):
    trip = _create_trip(client)
    r = client.get(f"/trips/{trip['id']}/packing_items/")
    assert r.status_code == 200
    items = r.json()
    
    expected_names = {i["name"] for i in DEFAULT_PACKING_ITEMS}
    expected_categories = {i["category"] for i in DEFAULT_PACKING_ITEMS}
    
    actual_names = {i["name"] for i in items}
    actual_categories = {i["category"] for i in items}
    
    assert expected_names.issubset(actual_names)
    assert expected_categories.issubset(actual_categories)
    assert len(items) == len(DEFAULT_PACKING_ITEMS)

# ---------------------------------------------------------------------------
# GET /trips/{trip_id}
# ---------------------------------------------------------------------------

def test_get_trip_by_id(client):
    trip = _create_trip(client, title="Find Me")
    response = client.get(f"/trips/{trip['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == trip["id"]
    assert response.json()["title"] == "Find Me"


def test_get_trip_not_found(client):
    response = client.get("/trips/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}
# ---------------------------------------------------------------------------

def test_update_trip_title(client):
    trip = _create_trip(client, title="Old Title")
    response = client.patch(f"/trips/{trip['id']}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


def test_update_trip_partial_keeps_other_fields(client):
    trip = _create_trip(client, title="Road Trip", destination="Berlin")
    response = client.patch(f"/trips/{trip['id']}", json={"destination": "Munich"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Road Trip"       # unchanged
    assert data["destination"] == "Munich"     # updated


def test_update_trip_not_found(client):
    response = client.patch(
        "/trips/00000000-0000-0000-0000-000000000000",
        json={"title": "Ghost"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}
# ---------------------------------------------------------------------------

def test_delete_trip(client):
    trip = _create_trip(client)
    response = client.delete(f"/trips/{trip['id']}")
    assert response.status_code == 204

    # Confirm it is gone
    response = client.get(f"/trips/{trip['id']}")
    assert response.status_code == 404


def test_delete_trip_not_found(client):
    response = client.delete("/trips/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_delete_trip_removed_from_list(client):
    trip = _create_trip(client, title="To Delete")
    _create_trip(client, title="To Keep")

    client.delete(f"/trips/{trip['id']}")

    titles = [t["title"] for t in client.get(TRIPS).json()]
    assert "To Delete" not in titles
    assert "To Keep" in titles
