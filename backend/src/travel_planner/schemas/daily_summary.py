from datetime import time as Time
from pydantic import BaseModel


class DailySummaryItem(BaseModel):
    type: str
    id: str
    label: str | None = None
    time: Time | None = None
    cost: float | None = None