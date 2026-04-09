"""
Integration tests for /trips/{trip_id}/days/{day_id}/activities endpoints.

Key behaviours verified:
- Standard CRUD operations
- An Activity belongs to exactly one Day (cross-day/cross-trip access returns 404)
- Status field accepts only valid enum values
- Deleting a Day cascades and removes its Activities
- Deleting a Trip cascades through Days down to Activities
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"
VALID_STATUSES = ("draft", "to_book", "booked", "cancelled", "completed")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {
        "title": "Activity Test Trip",
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


def _activities_url(trip_id: str, day_id: str) -> str:
    return f"/trips/{trip_id}/days/{day_id}/activities/"


def _create_activity(client: TestClient, trip_id: str, day_id: str, **kwargs) -> dict:
    payload = {"title": "Visit Museum", **kwargs}
    r = client.post(_activities_url(trip_id, day_id), json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/days/{day_id}/activities/
# ---------------------------------------------------------------------------

def test_list_activities_empty(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.get(_activities_url(trip["id"], day["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_activities_returns_created(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    _create_activity(client, trip["id"], day["id"], title="Colosseum")
    _create_activity(client, trip["id"], day["id"], title="Vatican")

    r = client.get(_activities_url(trip["id"], day["id"]))
    assert r.status_code == 200
    titles = [a["title"] for a in r.json()]
    assert "Colosseum" in titles
    assert "Vatican" in titles


def test_list_activities_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/days/{fake}/activities/")
    assert r.status_code == 404


def test_list_activities_day_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/days/{fake}/activities/")
    assert r.status_code == 404


def test_list_activities_isolated_per_day(client):
    trip = _create_trip(client)
    day1 = _create_day(client, trip["id"], day_date="2025-08-10")
    day2 = _create_day(client, trip["id"], day_date="2025-08-11")
    _create_activity(client, trip["id"], day1["id"])

    r = client.get(_activities_url(trip["id"], day2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/days/{day_id}/activities/
# ---------------------------------------------------------------------------

def test_create_activity_minimal(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.post(_activities_url(trip["id"], day["id"]), json={"title": "Hike"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Hike"
    assert data["day_id"] == day["id"]
    assert "id" in data


def test_create_activity_full(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    payload = {
        "title": "Uffizi Gallery",
        "description": "Renaissance art tour",
        "location": "Florence",
        "start_time": "10:00:00",
        "end_time": "13:00:00",
        "cost": 25.0,
        "status": "to_book",
        "notes": "Book in advance",
    }
    r = client.post(_activities_url(trip["id"], day["id"]), json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Uffizi Gallery"
    assert data["location"] == "Florence"
    assert data["cost"] == 25.0
    assert data["status"] == "to_book"


def test_create_activity_missing_title_rejected(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.post(_activities_url(trip["id"], day["id"]), json={"location": "Rome"})
    assert r.status_code == 422


def test_create_activity_all_valid_statuses(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    for status in VALID_STATUSES:
        r = client.post(
            _activities_url(trip["id"], day["id"]),
            json={"title": f"Activity {status}", "status": status},
        )
        assert r.status_code == 201, f"Failed for status: {status}"


def test_create_activity_invalid_status_rejected(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.post(
        _activities_url(trip["id"], day["id"]),
        json={"title": "Bad", "status": "unknown_status"},
    )
    assert r.status_code == 422


def test_create_activity_negative_cost_rejected(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    r = client.post(
        _activities_url(trip["id"], day["id"]),
        json={"title": "Free?", "cost": -10.0},
    )
    assert r.status_code == 422


def test_create_activity_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(f"/trips/{fake}/days/{fake}/activities/", json={"title": "Ghost"})
    assert r.status_code == 404


def test_create_activity_day_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(f"/trips/{trip['id']}/days/{fake}/activities/", json={"title": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/days/{day_id}/activities/{activity_id}
# ---------------------------------------------------------------------------

def test_get_activity_by_id(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"])
    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == activity["id"]


def test_get_activity_not_found(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/activities/{fake}")
    assert r.status_code == 404


def test_get_activity_wrong_day_returns_404(client):
    trip = _create_trip(client)
    day1 = _create_day(client, trip["id"], day_date="2025-08-10")
    day2 = _create_day(client, trip["id"], day_date="2025-08-11")
    activity = _create_activity(client, trip["id"], day1["id"])
    r = client.get(f"/trips/{trip['id']}/days/{day2['id']}/activities/{activity['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/days/{day_id}/activities/{activity_id}
# ---------------------------------------------------------------------------

def test_update_activity_title(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"], title="Old Title")
    r = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}",
        json={"title": "New Title"},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "New Title"


def test_update_activity_status(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"])
    r = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}",
        json={"status": "booked"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "booked"


def test_update_activity_partial_keeps_other_fields(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"], title="Tour", location="Rome")
    r = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}",
        json={"location": "Milan"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Tour"      # unchanged
    assert data["location"] == "Milan"  # updated


def test_update_activity_not_found(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(
        f"/trips/{trip['id']}/days/{day['id']}/activities/{fake}",
        json={"title": "Ghost"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/days/{day_id}/activities/{activity_id}
# ---------------------------------------------------------------------------

def test_delete_activity(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"])

    r = client.delete(f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}")
    assert r.status_code == 404


def test_delete_activity_not_found(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/days/{day['id']}/activities/{fake}")
    assert r.status_code == 404


def test_delete_day_cascades_to_activities(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    activity = _create_activity(client, trip["id"], day["id"])

    client.delete(f"/trips/{trip['id']}/days/{day['id']}")

    assert client.get(f"/trips/{trip['id']}/days/{day['id']}").status_code == 404
    r = client.get(f"/trips/{trip['id']}/days/{day['id']}/activities/{activity['id']}")
    assert r.status_code == 404


def test_delete_trip_cascades_through_days_to_activities(client):
    trip = _create_trip(client)
    day = _create_day(client, trip["id"])
    _create_activity(client, trip["id"], day["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(_activities_url(trip["id"], day["id"])).status_code == 404