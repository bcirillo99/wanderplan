# backend/src/travel_planner/schemas/packing_item.py
from uuid import UUID
from pydantic import BaseModel
from travel_planner.db.enums import PackingCategory

# `checked` is intentionally excluded from Base and Update schemas.
# Toggling a packing item is a dedicated action, not a generic field update.
# Use PATCH /packing-items/{id}/toggle to flip the checked state.
# This keeps the update endpoint clean and the toggle logic explicit.
class PackingItemBase(BaseModel):
    name: str
    category: PackingCategory | None = None
    notes: str | None = None


class PackingItemCreate(PackingItemBase):
    pass


class PackingItemUpdate(BaseModel):
    name: str | None = None
    category: PackingCategory | None = None
    notes: str | None = None


class PackingItemResponse(PackingItemBase):
    id: UUID
    trip_id: UUID
    checked: bool

    model_config = {"from_attributes": True}