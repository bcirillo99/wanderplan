# backend/src/travel_planner/schemas/flight.py
from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel, field_validator
from travel_planner.db.enums import Status


class FlightBase(BaseModel):
    origin: str
    destination: str
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    airline: str | None = None
    flight_number: str | None = None
    baggage_included: bool | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    booking_reference: str | None = None
    link: str | None = None
    notes: str | None = None
    stops: int | None = None
    legs: list[Any] | None = None

    @field_validator("arrival_time")
    @classmethod
    def validate_times(cls, arrival_time, info):
        departure_time = info.data.get("departure_time")
        if departure_time and arrival_time and arrival_time < departure_time:
            raise ValueError("arrival_time must be after departure_time")
        return arrival_time

    @field_validator("cost")
    @classmethod
    def validate_cost(cls, cost):
        if cost is not None and cost < 0:
            raise ValueError("cost must be positive")
        return cost


class FlightCreate(FlightBase):
    pass


class FlightUpdate(BaseModel):
    origin: str | None = None
    destination: str | None = None
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    airline: str | None = None
    flight_number: str | None = None
    baggage_included: bool | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    booking_reference: str | None = None
    link: str | None = None
    notes: str | None = None
    stops: int | None = None
    legs: list[Any] | None = None

    @field_validator("arrival_time")
    @classmethod
    def validate_times(cls, arrival_time, info):
        departure_time = info.data.get("departure_time")
        if departure_time and arrival_time and arrival_time < departure_time:
            raise ValueError("arrival_time must be after departure_time")
        return arrival_time

    @field_validator("cost")
    @classmethod
    def validate_cost(cls, cost):
        if cost is not None and cost < 0:
            raise ValueError("cost must be positive")
        return cost


class FlightResponse(FlightBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}