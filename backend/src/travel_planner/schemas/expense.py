# backend/src/travel_planner/schemas/expense.py
from uuid import UUID
from pydantic import BaseModel, field_validator
from travel_planner.db.enums import ExpenseCategory


class ExpenseBase(BaseModel):
    category: ExpenseCategory
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

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
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

class ExpenseResponse(ExpenseBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}

