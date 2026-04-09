# backend/src/travel_planner/schemas/trip.py
from uuid import UUID
from datetime import date
from pydantic import BaseModel, field_validator, HttpUrl


class TripBase(BaseModel):
    title: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    destination: str | None = None
    cover_image: HttpUrl | None = None

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, end_date, info):
        start_date = info.data.get("start_date")
        if start_date and end_date and end_date < start_date:
            raise ValueError("end_date must be after start_date")
        return end_date


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    destination: str | None = None
    cover_image: HttpUrl | None = None


class TripResponse(TripBase):
    id: UUID

    model_config = {"from_attributes": True}