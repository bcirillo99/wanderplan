# backend/src/travel_planner/schemas/flight.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, HttpUrl, field_validator
from travel_planner.db.enums import Status


class FlightBase(BaseModel):
    departure_airport: str | None = None
    arrival_airport: str | None = None
    departure_datetime: datetime | None = None
    arrival_datetime: datetime | None = None
    company: str | None = None
    flight_number: str | None = None
    baggage_included: bool | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    link: HttpUrl | None = None

    @field_validator("arrival_datetime")
    @classmethod
    def validate_datetimes(cls, arrival_datetime, info):
        departure_datetime = info.data.get("departure_datetime")
        if departure_datetime and arrival_datetime and arrival_datetime < departure_datetime:
            raise ValueError("arrival_datetime must be after departure_datetime")
        return arrival_datetime


class FlightCreate(FlightBase):
    pass


class FlightUpdate(FlightBase):
    pass


class FlightResponse(FlightBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}