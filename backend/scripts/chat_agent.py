"""
Test agentic chat: testo + tool calling (insert).

Usage (from backend/):
    uv run python test_chat_agent.py <trip_uuid> "<messaggio>"

Esempi:
    # Query → risposta testuale
    uv run python test_chat_agent.py <uuid> "Ho conflitti di orario?"

    # Action → propone insert
    uv run python test_chat_agent.py <uuid> "Aggiungi una visita al Père Lachaise il 7 giugno alle 11"
"""
import sys
import os
import json
from uuid import UUID
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import requests

from travel_planner.db.session import SessionLocal
from travel_planner.services import (
    trip_service, activity_service, flight_service,
    accommodation_service, transport_service,
    extra_service, packing_item_service, note_service,
)

OLLAMA_URL   = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen3.5:4b"

# ── Tool definitions ───────────────────────────────────────────────────────────

TOOLS = [
    {"type": "function", "function": {
        "name": "insert_activity",
        "description": "Add a new activity to the trip",
        "parameters": {
            "type": "object",
            "required": ["title"],
            "properties": {
                "title":         {"type": "string"},
                "activity_date": {"type": "string", "description": "ISO date e.g. 2026-06-06"},
                "start_time":    {"type": "string", "description": "HH:MM:SS"},
                "end_time":      {"type": "string"},
                "location":      {"type": "string"},
                "description":   {"type": "string"},
                "cost":          {"type": "number"},
                "status":        {"type": "string", "enum": ["draft","to_book","booked","cancelled","completed"]},
                "notes":         {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_transport",
        "description": "Add a new transport to the trip",
        "parameters": {
            "type": "object",
            "required": ["transport_type", "origin", "destination"],
            "properties": {
                "transport_type": {"type": "string", "enum": ["train","bus","car","shuttle","ferry","taxi","other"]},
                "origin":         {"type": "string"},
                "destination":    {"type": "string"},
                "departure_time": {"type": "string", "description": "ISO datetime e.g. 2026-06-06T09:00:00"},
                "arrival_time":   {"type": "string"},
                "cost":           {"type": "number"},
                "status":         {"type": "string", "enum": ["draft","to_book","booked","cancelled","completed"]},
                "operator":       {"type": "string"},
                "notes":          {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_accommodation",
        "description": "Add a new accommodation to the trip",
        "parameters": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name":               {"type": "string"},
                "accommodation_type": {"type": "string", "enum": ["hotel","hostel","airbnb","lodge","camping","resort","apartment","other"]},
                "address":            {"type": "string"},
                "check_in":           {"type": "string", "description": "ISO date"},
                "check_out":          {"type": "string", "description": "ISO date"},
                "cost_per_night":     {"type": "number"},
                "status":             {"type": "string", "enum": ["draft","to_book","booked","cancelled","completed"]},
                "notes":              {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_flight",
        "description": "Add a new flight to the trip",
        "parameters": {
            "type": "object",
            "required": ["origin", "destination"],
            "properties": {
                "origin":         {"type": "string"},
                "destination":    {"type": "string"},
                "departure_time": {"type": "string", "description": "ISO datetime"},
                "arrival_time":   {"type": "string"},
                "airline":        {"type": "string"},
                "flight_number":  {"type": "string"},
                "cost":           {"type": "number"},
                "status":         {"type": "string", "enum": ["draft","to_book","booked","cancelled","completed"]},
                "notes":          {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_note",
        "description": "Add a new note to the trip",
        "parameters": {
            "type": "object",
            "required": ["text"],
            "properties": {
                "text": {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_packing_item",
        "description": "Add a new packing item to the trip",
        "parameters": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name":     {"type": "string"},
                "category": {"type": "string", "enum": ["documents","clothing","medicine","technology","toiletries","accessories","food","comfort","extras"]},
                "notes":    {"type": "string"},
            }
        }
    }},
    {"type": "function", "function": {
        "name": "insert_extra",
        "description": "Add a new extra expense to the trip",
        "parameters": {
            "type": "object",
            "required": [],
            "properties": {
                "category":     {"type": "string", "enum": ["accommodation","transport","activities","food","shopping","other"]},
                "description":  {"type": "string"},
                "amount":       {"type": "number"},
                "currency":     {"type": "string"},
                "is_estimated": {"type": "boolean"},
                "notes":        {"type": "string"},
            }
        }
    }},
]

# ── Context serializer ─────────────────────────────────────────────────────────

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
        t_range = ""
        if ac.start_time:
            t_range = f" {str(ac.start_time)[:5]}"
            if ac.end_time:
                t_range += f"-{str(ac.end_time)[:5]}"
        lines.append(f"Activity: {ac.title or '?'} | {ac.activity_date or '?'}{t_range} | {ac.location or ''} | {ac.status or ''}")
    for e in data["extras"]:
        lines.append(f"Extra: {e.category or ''} | {e.description or ''} | {e.amount or ''} {e.currency or ''}")
    for p in data["packing_items"]:
        lines.append(f"Packing: {'✓' if p.checked else '○'} {p.name} | {p.category or ''}")
    for n in data["notes"]:
        lines.append(f"Note: {n.text[:200]}")
    return "\n".join(lines)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) != 3:
        print('Usage: uv run python test_chat_agent.py <trip_uuid> "<messaggio>"')
        sys.exit(1)

    trip_uuid    = UUID(sys.argv[1])
    user_message = sys.argv[2]

    db = SessionLocal()
    try:
        trip = trip_service.get_by_id(db, trip_uuid)
        if not trip:
            print(f"Trip {trip_uuid} not found"); sys.exit(1)
        trip_id = trip.id
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
    system_prompt = (
        f"You are WanderPlan AI, a travel planning assistant.\n"
        f"Rules:\n"
        f"- Only INSERT new items — never propose deletes or edits of existing ones.\n"
        f"- When user asks to add something, call the appropriate insert_* tool once. Use only the fields the user explicitly mentioned; do not invent extra details.\n"
        f"- IMPORTANT: Before inserting, verify the date falls within the trip dates ({trip.start_date} → {trip.end_date}). If it does not, reply with a text message explaining the conflict — do NOT call any tool.\n"
        f"- When user asks a question or wants advice, reply with plain text.\n"
        f"- Flag schedule conflicts proactively. Keep replies concise.\n"
        f"- Today: {date.today()}. Trip dates: {trip.start_date} → {trip.end_date}.\n\n"
        f"TRIP CONTEXT:\n{context}"
    )

    print("── CONTEXT ───────────────────────────────")
    print(context)
    print("──────────────────────────────────────────\n")
    print(f"User: {user_message}\n")

    import time
    print("Calling Ollama...\n")
    t0 = time.time()

    payload = {
        "model":   OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "tools":  TOOLS,
        "think":  False,
        "stream": False,
    }

    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
    except Exception as e:
        print(f"Ollama error: {e}\nIs Ollama running? → ollama serve")
        sys.exit(1)

    elapsed = time.time() - t0
    result  = resp.json()
    message = result.get("message", {})

    tool_calls = message.get("tool_calls")
    if tool_calls:
        call        = tool_calls[0]
        entity_type = call["function"]["name"].removeprefix("insert_")
        args        = call["function"]["arguments"]
        if isinstance(args, str):
            args = json.loads(args)

        # Date validation in code — LLM not reliable for this
        out_of_range_msg = None
        item_date = None
        if entity_type == "activity":
            item_date = args.get("activity_date")
        elif entity_type in ("flight", "transport"):
            dt = args.get("departure_time", "")
            item_date = dt[:10] if dt else None

        if item_date:
            if item_date < str(trip.start_date) or item_date > str(trip.end_date):
                out_of_range_msg = (
                    f"La data {item_date} è fuori dal range del viaggio "
                    f"({trip.start_date} → {trip.end_date})."
                )

        if out_of_range_msg:
            print("── TEXT RESPONSE (date conflict) ─────────")
            print(out_of_range_msg)
            print("──────────────────────────────────────────")
        else:
            print("── PROPOSED ACTION ───────────────────────")
            print(f"type:        action")
            print(f"entity_type: {entity_type}")
            print(f"data:        {json.dumps(args, indent=2, ensure_ascii=False)}")
            print("──────────────────────────────────────────")
    else:
        print(f"── TEXT RESPONSE ─────────────────────────")
        print(message.get("content", ""))
        print("──────────────────────────────────────────")

    print(f"\n[{elapsed:.1f}s]")


if __name__ == "__main__":
    main()
