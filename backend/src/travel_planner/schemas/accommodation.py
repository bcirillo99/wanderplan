# backend/src/travel_planner/schemas/accommodation.py
from uuid import UUID
from datetime import date
from pydantic import BaseModel, field_validator, HttpUrl
from travel_planner.db.enums import Status, AccommodationType


class AccommodationBase(BaseModel):
    type: AccommodationType | None = None
    name: str | None = None
    location: str | None = None
    checkin_date: date | None = None
    checkout_date: date | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    cancellation_date: date | None = None
    link: HttpUrl | None = None
    extra_details: dict | None = None
    notes: str | None = None

    @field_validator("checkout_date")
    @classmethod
    def validate_dates(cls, checkout_date, info):
        checkin_date = info.data.get("checkin_date")
        if checkin_date and checkout_date and checkout_date < checkin_date:
            raise ValueError("checkout_date must be after checkin_date")
        return checkout_date


class AccommodationCreate(AccommodationBase):
    pass


class AccommodationUpdate(AccommodationBase):
    pass


class AccommodationResponse(AccommodationBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}