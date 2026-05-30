"""
Usage (from backend/):
    uv run python test_chat.py <trip_uuid> "<messaggio>"
"""
import sys
import os
from uuid import UUID
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import json
import requests

from travel_planner.db.session import SessionLocal
from travel_planner.services import (
    trip_service, activity_service, flight_service,
    accommodation_service, transport_service,
    extra_service, packing_item_service, note_service,
)

OLLAMA_URL   = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen3.5:4b"


def serialize_trip(data: dict) -> str:
    lines = []
    t = data["trip"]
    lines.append(f"Trip: {t.title} | {t.destination or '?'} | {t.start_date} → {t.end_date}")

    for f in data["flights"]:
        dt = str(f.departure_time)[:16] if f.departure_time else "?"
        lines.append(f"Flight: {f.origin}→{f.destination} | dep {dt} | {f.airline or ''} | {f.status or ''}")

    for a in data["accommodations"]:
        lines.append(f"Accommodation: {a.name} | {a.accommodation_type or ''} | {a.check_in} → {a.check_out} | {a.status or ''}")

    for tr in data["transports"]:
        dt = str(tr.departure_time)[:16] if tr.departure_time else "?"
        lines.append(f"Transport: {tr.transport_type} | {tr.origin}→{tr.destination} | dep {dt} | {tr.status or ''}")

    for ac in data["activities"]:
        time_range = ""
        if ac.start_time:
            time_range = f" {str(ac.start_time)[:5]}"
            if ac.end_time:
                time_range += f"-{str(ac.end_time)[:5]}"
        lines.append(f"Activity: {ac.title or '?'} | {ac.activity_date or '?'}{time_range} | {ac.location or ''} | {ac.status or ''}")

    for e in data["extras"]:
        lines.append(f"Extra: {e.category or ''} | {e.description or ''} | {e.amount or ''} {e.currency or ''}")

    for p in data["packing_items"]:
        lines.append(f"Packing: {'✓' if p.checked else '○'} {p.name} | {p.category or ''}")

    for n in data["notes"]:
        lines.append(f"Note: {n.text[:200]}")

    return "\n".join(lines)


def main():
    if len(sys.argv) != 3:
        print("Usage: uv run python test_chat.py <trip_uuid> \"<messaggio>\"")
        sys.exit(1)

    trip_uuid    = UUID(sys.argv[1])
    user_message = sys.argv[2]

    db = SessionLocal()
    try:
        trip = trip_service.get_by_id(db, trip_uuid)
        if not trip:
            print(f"Trip {trip_uuid} not found"); sys.exit(1)

        trip_id  = trip.id
        trip_data = {
            "trip":           trip,
            "activities":     activity_service.get_all_by_trip(db, trip_id),
            "flights":        flight_service.get_all_by_trip(db, trip_id),
            "accommodations": accommodation_service.get_all_by_trip(db, trip_id),
            "transports":     transport_service.get_all_by_trip(db, trip_id),
            "extras":         extra_service.get_all_by_trip(db, trip_id),
            "packing_items":  packing_item_service.get_all_by_trip(db, trip_id),
            "notes":          note_service.get_all_by_trip(db, trip_id),
        }
    finally:
        db.close()

    context = serialize_trip(trip_data)
    print("── CONTEXT ───────────────────────────────")
    print(context)
    print(f"──────────────────────────────────────────\n")
    print(f"User: {user_message}\n")

    system_prompt = (
        f"Sei WanderPlan AI, assistente per la pianificazione viaggi.\n"
        f"Rispondi in modo conciso. Oggi: {date.today()}. "
        f"Trip dates: {trip.start_date} → {trip.end_date}.\n\n"
        f"TRIP CONTEXT:\n{context}"
    )

    import time
    print("Calling Ollama... (streaming)\n")
    t0 = time.time()

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "stream": True,
        "think": False,
    }

    try:
        resp = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120)
        resp.raise_for_status()
    except Exception as e:
        print(f"Ollama error: {e}\nIs Ollama running? → ollama serve")
        sys.exit(1)

    print("Assistant: ", end="", flush=True)
    for line in resp.iter_lines():
        if not line:
            continue
        chunk = json.loads(line)
        content = chunk.get("message", {}).get("content", "")
        if content:
            print(content, end="", flush=True)
        if chunk.get("done"):
            break
    print(f"\n\n[{time.time() - t0:.1f}s]")


if __name__ == "__main__":
    main()
