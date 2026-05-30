# backend/src/travel_planner/schemas/accommodation.py
from uuid import UUID
from datetime import date
from pydantic import BaseModel, field_validator
from travel_planner.db.enums import Status, AccommodationType


class AccommodationBase(BaseModel):
    name: str
    accommodation_type: AccommodationType | None = None
    address: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    check_in: date | None = None
    check_out: date | None = None
    status: Status | None = None
    cost_per_night: float | None = None
    pay_method: str | None = None
    cancellation_date: date | None = None
    link: str | None = None
    extra_details: dict | None = None
    notes: str | None = None
    booking_reference: str | None = None

    @field_validator("check_out")
    @classmethod
    def validate_dates(cls, check_out, info):
        check_in = info.data.get("check_in")
        if check_in and check_out and check_out < check_in:
            raise ValueError("check_out must be after check_in")
        return check_out

    @field_validator("cost_per_night")
    @classmethod
    def validate_cost_per_night(cls, cost_per_night):
        if cost_per_night is not None and cost_per_night < 0:
            raise ValueError("cost_per_night must be positive")
        return cost_per_night


class AccommodationCreate(AccommodationBase):
    pass


class AccommodationUpdate(BaseModel):
    name: str | None = None
    accommodation_type: AccommodationType | None = None
    address: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    check_in: date | None = None
    check_out: date | None = None
    status: Status | None = None
    cost_per_night: float | None = None
    pay_method: str | None = None
    cancellation_date: date | None = None
    link: str | None = None
    extra_details: dict | None = None
    notes: str | None = None
    booking_reference: str | None = None

    @field_validator("check_out")
    @classmethod
    def validate_dates(cls, check_out, info):
        check_in = info.data.get("check_in")
        if check_in and check_out and check_out < check_in:
            raise ValueError("check_out must be after check_in")
        return check_out
    
    @field_validator("cost_per_night")
    @classmethod
    def validate_cost_per_night(cls, cost_per_night):
        if cost_per_night is not None and cost_per_night < 0:
            raise ValueError("cost_per_night must be positive")
        return cost_per_night


class AccommodationResponse(AccommodationBase):
    id: UUID
    trip_id: UUID
    total_cost: float | None = None

    model_config = {"from_attributes": True}