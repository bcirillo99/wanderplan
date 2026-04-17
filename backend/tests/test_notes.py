"""
Integration tests for /trips/{trip_id}/notes endpoints.

Key behaviours verified:
- Standard CRUD operations
- Notes are isolated per trip
- Empty text is rejected
- Cascade delete: deleting a trip deletes its notes
"""
from fastapi.testclient import TestClient

TRIPS = "/trips/"


def _create_trip(client: TestClient, **kwargs) -> dict:
    payload = {
        "title": "Note Test Trip",
        "start_date": "2025-08-01",
        "end_date": "2025-08-31",
        **kwargs,
    }
    r = client.post(TRIPS, json=payload)
    assert r.status_code == 201
    return r.json()


def _notes_url(trip_id: str) -> str:
    return f"/trips/{trip_id}/notes/"


def _create_note(client: TestClient, trip_id: str, text: str = "My note") -> dict:
    r = client.post(_notes_url(trip_id), json={"text": text})
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/notes/
# ---------------------------------------------------------------------------

def test_list_notes_empty(client):
    trip = _create_trip(client)
    r = client.get(_notes_url(trip["id"]))
    assert r.status_code == 200
    assert r.json() == []


def test_list_notes_returns_created(client):
    trip = _create_trip(client)
    _create_note(client, trip["id"], text="First note")
    _create_note(client, trip["id"], text="Second note")

    r = client.get(_notes_url(trip["id"]))
    assert r.status_code == 200
    texts = [n["text"] for n in r.json()]
    assert "First note" in texts
    assert "Second note" in texts


def test_list_notes_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{fake}/notes/")
    assert r.status_code == 404


def test_list_notes_isolated_per_trip(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    _create_note(client, trip1["id"])

    r = client.get(_notes_url(trip2["id"]))
    assert r.json() == []


# ---------------------------------------------------------------------------
# POST /trips/{trip_id}/notes/
# ---------------------------------------------------------------------------

def test_create_note(client):
    trip = _create_trip(client)
    r = client.post(_notes_url(trip["id"]), json={"text": "Hello world"})
    assert r.status_code == 201
    data = r.json()
    assert data["text"] == "Hello world"
    assert "id" in data
    assert "trip_id" in data
    assert data["trip_id"] == trip["id"]
    assert "created_at" in data


def test_create_note_missing_text_rejected(client):
    trip = _create_trip(client)
    r = client.post(_notes_url(trip["id"]), json={})
    assert r.status_code == 422


def test_create_note_trip_not_found(client):
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.post(f"/trips/{fake}/notes/", json={"text": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /trips/{trip_id}/notes/{note_id}
# ---------------------------------------------------------------------------

def test_get_note_by_id(client):
    trip = _create_trip(client)
    note = _create_note(client, trip["id"])
    r = client.get(f"/trips/{trip['id']}/notes/{note['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == note["id"]


def test_get_note_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/trips/{trip['id']}/notes/{fake}")
    assert r.status_code == 404


def test_get_note_wrong_trip_returns_404(client):
    trip1 = _create_trip(client)
    trip2 = _create_trip(client)
    note = _create_note(client, trip1["id"])
    r = client.get(f"/trips/{trip2['id']}/notes/{note['id']}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /trips/{trip_id}/notes/{note_id}
# ---------------------------------------------------------------------------

def test_update_note_text(client):
    trip = _create_trip(client)
    note = _create_note(client, trip["id"], text="Old text")
    r = client.patch(
        f"/trips/{trip['id']}/notes/{note['id']}",
        json={"text": "New text"},
    )
    assert r.status_code == 200
    assert r.json()["text"] == "New text"


def test_update_note_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.patch(
        f"/trips/{trip['id']}/notes/{fake}",
        json={"text": "Ghost"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /trips/{trip_id}/notes/{note_id}
# ---------------------------------------------------------------------------

def test_delete_note(client):
    trip = _create_trip(client)
    note = _create_note(client, trip["id"])

    r = client.delete(f"/trips/{trip['id']}/notes/{note['id']}")
    assert r.status_code == 204

    r = client.get(f"/trips/{trip['id']}/notes/{note['id']}")
    assert r.status_code == 404


def test_delete_note_not_found(client):
    trip = _create_trip(client)
    fake = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/trips/{trip['id']}/notes/{fake}")
    assert r.status_code == 404


def test_delete_trip_cascades_to_notes(client):
    trip = _create_trip(client)
    note = _create_note(client, trip["id"])

    client.delete(f"/trips/{trip['id']}")

    assert client.get(f"/trips/{trip['id']}").status_code == 404
    assert client.get(f"/trips/{trip['id']}/notes/{note['id']}").status_code == 404
