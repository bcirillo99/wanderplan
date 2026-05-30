"""
chat_service.py — Agentic logic for the chat assistant.

Flow:
  1. _summarize()  → serializes the trip into compact text (context window)
  2. chat()        → calls Ollama with tools, interprets the response

Two possible response types:
  - type="text"   → LLM replied with plain text (question, advice, error)
  - type="action" → LLM called an insert_* tool → proposed action to confirm on the frontend

The insert does NOT happen here: the service only returns the proposal.
The frontend is responsible for the confirmation REST call (e.g. POST /trips/{id}/activities),
so the user can review and approve before anything is saved.
"""

import json
from datetime import date
from uuid import UUID

import requests
from sqlalchemy.orm import Session

from travel_planner.config import settings
from travel_planner.schemas.chat import ChatResponse, HistoryMessage, ProposedAction
from travel_planner.services import (
    activity_service,
    accommodation_service,
    extra_service,
    flight_service,
    note_service,
    packing_item_service,
    transport_service,
    trip_service,
)

# ── Tool definitions ───────────────────────────────────────────────────────────
# Each tool maps to an insertable entity in the trip.
# Names follow the insert_<entity> convention — used later to extract entity_type.
# Fields in "required" are the bare minimum; all others are optional and should
# only be populated when the user explicitly mentions them.
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
                "status":        {"type": "string", "enum": ["draft", "to_book", "booked", "cancelled", "completed"]},
                "notes":         {"type": "string"},
            },
        },
    }},
    {"type": "function", "function": {
        "name": "insert_transport",
        "description": "Add a new transport to the trip",
        "parameters": {
            "type": "object",
            "required": ["transport_type", "origin", "destination"],
            "properties": {
                "transport_type": {"type": "string", "enum": ["train", "bus", "car", "shuttle", "ferry", "taxi", "other"]},
                "origin":         {"type": "string"},
                "destination":    {"type": "string"},
                "departure_time": {"type": "string", "description": "ISO datetime e.g. 2026-06-06T09:00:00"},
                "arrival_time":   {"type": "string"},
                "cost":           {"type": "number"},
                "status":         {"type": "string", "enum": ["draft", "to_book", "booked", "cancelled", "completed"]},
                "operator":       {"type": "string"},
                "notes":          {"type": "string"},
            },
        },
    }},
    {"type": "function", "function": {
        "name": "insert_accommodation",
        "description": "Add a new accommodation to the trip",
        "parameters": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name":               {"type": "string"},
                "accommodation_type": {"type": "string", "enum": ["hotel", "hostel", "airbnb", "lodge", "camping", "resort", "apartment", "other"]},
                "address":            {"type": "string"},
                "check_in":           {"type": "string", "description": "ISO date"},
                "check_out":          {"type": "string", "description": "ISO date"},
                "cost_per_night":     {"type": "number"},
                "status":             {"type": "string", "enum": ["draft", "to_book", "booked", "cancelled", "completed"]},
                "notes":              {"type": "string"},
            },
        },
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
                "status":         {"type": "string", "enum": ["draft", "to_book", "booked", "cancelled", "completed"]},
                "notes":          {"type": "string"},
            },
        },
    }},
    {"type": "function", "function": {
        "name": "insert_note",
        "description": "Add a new note to the trip",
        "parameters": {
            "type": "object",
            "required": ["text"],
            "properties": {
                "text": {"type": "string"},
            },
        },
    }},
    {"type": "function", "function": {
        "name": "insert_packing_item",
        "description": "Add a new packing item to the trip",
        "parameters": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name":     {"type": "string"},
                "category": {"type": "string", "enum": ["documents", "clothing", "medicine", "technology", "toiletries", "accessories", "food", "comfort", "extras"]},
                "notes":    {"type": "string"},
            },
        },
    }},
    {"type": "function", "function": {
        "name": "insert_extra",
        "description": "Add a new extra expense to the trip",
        "parameters": {
            "type": "object",
            "required": [],
            "properties": {
                "category":     {"type": "string", "enum": ["accommodation", "transport", "activities", "food", "shopping", "other"]},
                "description":  {"type": "string"},
                "amount":       {"type": "number"},
                "currency":     {"type": "string"},
                "is_estimated": {"type": "boolean"},
                "notes":        {"type": "string"},
            },
        },
    }},
]


def _summarize(db: Session, trip_id: UUID) -> str:
    """
    Serializes the entire trip into compact text to inject into the system prompt.

    Pipe-separated format chosen for density: one line per entity, fields separated
    by |. The LLM understands this format and uses it to answer questions like
    "do I have schedule conflicts?" or "what's missing?".

    Truncation notes:
    - departure_time/arrival_time → [:16] strips seconds (irrelevant in context)
    - note text → [:200] prevents context overflow on long notes
    """
    trip = trip_service.get_by_id(db, trip_id)
    lines = [f"Trip: {trip.title} | {trip.destination or '?'} | {trip.start_date} → {trip.end_date}"]

    for f in flight_service.get_all_by_trip(db, trip_id):
        dt = str(f.departure_time)[:16] if f.departure_time else "?"
        lines.append(f"Flight: {f.origin}→{f.destination} | dep {dt} | {f.airline or ''} | {f.status or ''}")

    for a in accommodation_service.get_all_by_trip(db, trip_id):
        lines.append(f"Accommodation: {a.name} | {a.accommodation_type or ''} | {a.check_in} → {a.check_out} | {a.status or ''}")

    for tr in transport_service.get_all_by_trip(db, trip_id):
        dt = str(tr.departure_time)[:16] if tr.departure_time else "?"
        lines.append(f"Transport: {tr.transport_type} | {tr.origin}→{tr.destination} | dep {dt} | {tr.status or ''}")

    for ac in activity_service.get_all_by_trip(db, trip_id):
        t_range = ""
        if ac.start_time:
            t_range = f" {str(ac.start_time)[:5]}"
            if ac.end_time:
                t_range += f"-{str(ac.end_time)[:5]}"
        lines.append(f"Activity: {ac.title or '?'} | {ac.activity_date or '?'}{t_range} | {ac.location or ''} | {ac.status or ''}")

    for e in extra_service.get_all_by_trip(db, trip_id):
        lines.append(f"Extra: {e.category or ''} | {e.description or ''} | {e.amount or ''} {e.currency or ''}")

    for p in packing_item_service.get_all_by_trip(db, trip_id):
        lines.append(f"Packing: {'✓' if p.checked else '○'} {p.name} | {p.category or ''}")

    for n in note_service.get_all_by_trip(db, trip_id):
        lines.append(f"Note: {n.text[:200]}")

    return "\n".join(lines)


def chat(db: Session, trip_id: UUID, user_message: str, history: list[HistoryMessage] | None = None) -> ChatResponse:
    """
    Main entry point: sends the message to Ollama and interprets the response.

    Args:
        db           — SQLAlchemy session (injected by the router via Depends)
        trip_id      — UUID of the current trip
        user_message — text typed by the user in the chat

    Returns:
        ChatResponse with type="text" or type="action".

    Exceptions NOT handled here (delegated to the router):
        requests.exceptions.ConnectionError → Ollama unreachable
        requests.exceptions.Timeout         → Ollama took >120s
    """
    trip = trip_service.get_by_id(db, trip_id)
    context = _summarize(db, trip_id)

    # Trip dates appear twice in the prompt: once in the explicit rule and once
    # in the serialized context. Intentional redundancy — improves constraint
    # adherence without relying on date validation in the LLM (see below).
    system_prompt = (
        f"You are WanderPlan AI, a travel planning assistant.\n"
        f"Rules:\n"
        f"- Only INSERT new items — never propose deletes or edits of existing ones.\n"
        f"- Only call an insert_* tool when the user uses explicit action words: 'add', 'insert', 'create', 'book', 'schedule', 'put', 'aggiungi', 'inserisci', 'crea', 'prenota'. A question like 'what time is my flight?' or 'do I have a transport?' is NOT an insert request — answer it with plain text from the context.\n"
        f"- When calling an insert tool, use only fields the user explicitly mentioned. Never invent dates, times, locations, or any other details.\n"
        f"- IMPORTANT: Before inserting, verify the date falls within the trip dates ({trip.start_date} → {trip.end_date}). If it does not, reply with a text message explaining the conflict — do NOT call any tool.\n"
        f"- When user asks a question or wants advice, reply with plain text.\n"
        f"- Flag schedule conflicts proactively. Keep replies concise.\n"
        f"- IMPORTANT: Always reply in the same language the user writes in. The trip data may contain foreign words — ignore them for language detection; detect language from the user message only.\n"
        f"- Today: {date.today()}. Trip dates: {trip.start_date} → {trip.end_date}.\n\n"
        f"TRIP CONTEXT:\n{context}"
    )

    history_dicts = [{"role": m.role, "content": m.content} for m in (history or [])]

    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            *history_dicts,
            {"role": "user", "content": user_message},
        ],
        "tools": TOOLS,
        # think:False disables qwen's internal chain-of-thought — halves latency
        # with no quality loss for simple insert/query tasks
        "think": False,
        "stream": False,
    }

    resp = requests.post(settings.OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    message = resp.json().get("message", {})

    # No tool call → plain text response
    tool_calls = message.get("tool_calls")
    if not tool_calls:
        return ChatResponse(type="text", content=message.get("content", ""))

    # Only the first tool call is used — the prompt instructs the model to call one at a time
    call = tool_calls[0]
    entity_type = call["function"]["name"].removeprefix("insert_")  # "insert_activity" → "activity"
    args = call["function"]["arguments"]
    if isinstance(args, str):
        # Some Ollama models return arguments as a JSON string instead of a dict
        args = json.loads(args)

    # Date validation happens here in Python, not in the LLM.
    # The model frequently ignores the date constraint in the system prompt;
    # this check is the only reliable gate. ISO string comparison works correctly
    # because YYYY-MM-DD is lexicographically ordered.
    item_date = None
    if entity_type == "activity":
        item_date = args.get("activity_date")
    elif entity_type in ("flight", "transport"):
        dt = args.get("departure_time", "")
        item_date = dt[:10] if dt else None  # extract date part from ISO datetime
    elif entity_type == "accommodation":
        item_date = args.get("check_in")

    if item_date:
        if item_date < str(trip.start_date) or item_date > str(trip.end_date):
            return ChatResponse(
                type="text",
                content=(
                    f"The date {item_date} is outside the trip range "
                    f"({trip.start_date} → {trip.end_date})."
                ),
            )

    # Return the proposed action — the frontend shows an ActionCard and calls
    # the appropriate REST endpoint only after the user confirms
    return ChatResponse(
        type="action",
        action=ProposedAction(entity_type=entity_type, data=args),
    )
