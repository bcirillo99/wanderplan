# backend/src/travel_planner/schemas/extra.py
from uuid import UUID
from pydantic import BaseModel, field_validator
from travel_planner.db.enums import ExtraCategory


class ExtraBase(BaseModel):
    category: ExtraCategory
    description: str | None = None
    amount: float | None = None
    is_estimated: bool = False
    actual_amount: float | None = None
    currency: str | None = None
    notes: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, amount):
        if amount is not None and amount <= 0:
            raise ValueError("amount must be greater than zero")
        return amount

class ExtraCreate(ExtraBase):
    pass

class ExtraUpdate(BaseModel):
    category: ExtraCategory | None = None
    description: str | None = None
    amount: float | None = None
    is_estimated: bool | None = None
    actual_amount: float | None = None
    currency: str | None = None
    notes: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, amount):
        if amount is not None and amount <= 0:
            raise ValueError("amount must be greater than zero")
        return amount

class ExtraResponse(ExtraBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}
