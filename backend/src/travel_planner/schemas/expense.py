# backend/src/travel_planner/schemas/expense.py
from uuid import UUID
from pydantic import BaseModel
from travel_planner.db.enums import ExpenseCategory


class ExpenseBase(BaseModel):
    category: ExpenseCategory | None = None
    description: str | None = None
    amount: float | None = None
    is_estimated: bool = False
    actual_amount: float | None = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
    description: str | None = None
    amount: float | None = None
    is_estimated: bool | None = None
    actual_amount: float | None = None

class ExpenseResponse(ExpenseBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}

