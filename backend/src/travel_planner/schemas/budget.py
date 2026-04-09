# backend/src/travel_planner/schemas/budget.py
from uuid import UUID
from pydantic import BaseModel
from travel_planner.db.enums import BudgetCategory


class BudgetBase(BaseModel):
    category: BudgetCategory | None = None
    description: str | None = None
    amount: float | None = None
    is_estimated: bool = False
    actual_amount: float | None = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: BudgetCategory | None = None
    description: str | None = None
    amount: float | None = None
    is_estimated: bool | None = None
    actual_amount: float | None = None

class BudgetResponse(BudgetBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}

