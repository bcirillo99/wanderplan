# backend/src/travel_planner/schemas/activity.py
from uuid import UUID
from datetime import date, time
from pydantic import BaseModel, field_validator
from travel_planner.db.enums import Status
from datetime import date, time


class ActivityBase(BaseModel):
    title: str
    activity_date: date | None = None
    description: str | None = None
    start_time: time | None = None  
    end_time: time | None = None    
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    cancellation_date: date | None = None
    link: str | None = None
    notes: str | None = None

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, end_time, info):
        start_time = info.data.get("start_time")
        if start_time and end_time and end_time < start_time:
            raise ValueError("end_time must be after start_time")
        return end_time

    @field_validator("cost")
    @classmethod
    def validate_cost(cls, cost):
        if cost is not None and cost < 0:
            raise ValueError("cost must be positive")
        return cost

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    title: str | None = None
    activity_date: date | None = None
    description: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: Status | None = None
    cost: float | None = None
    pay_method: str | None = None
    cancellation_date: date | None = None
    link: str | None = None
    notes: str | None = None

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, end_time, info):
        start_time = info.data.get("start_time")
        if start_time and end_time and end_time < start_time:
            raise ValueError("end_time must be after start_time")
        return end_time
    
    @field_validator("cost")
    @classmethod
    def validate_cost(cls, cost):
        if cost is not None and cost < 0:
            raise ValueError("cost must be positive")
        return cost

class ActivityResponse(ActivityBase):
    id: UUID
    trip_id: UUID

    model_config = {"from_attributes": True}