# backend/src/travel_planner/schemas/note.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    text: str


class NoteUpdate(BaseModel):
    text: str | None = None


class NoteResponse(BaseModel):
    id: UUID
    trip_id: UUID
    created_at: datetime
    text: str

    model_config = {"from_attributes": True}
