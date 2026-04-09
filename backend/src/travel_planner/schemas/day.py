# backend/src/travel_planner/schemas/day.py
from uuid import UUID
from datetime import date
from pydantic import BaseModel


class DayBase(BaseModel):
    day_date: date
    location: str | None = None
    notes: str | None = None

class DayCreate(DayBase):
    pass

class DayUpdate(BaseModel):
    day_date: date | None = None
    location: str | None = None
    notes: str | None = None


class DayResponse(DayBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}
    