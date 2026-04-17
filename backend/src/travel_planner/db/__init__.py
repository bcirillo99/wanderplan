# backend/src/travel_planner/db/__init__.py
from .enums import (
    Status,
    AccommodationType,
    TransportType,
    PackingCategory,
    ExtraCategory,
)

from .base import Base

from . import models 