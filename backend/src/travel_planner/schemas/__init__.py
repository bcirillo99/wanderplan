# backend/src/travel_planner/schemas/__init__.py
from .trip import TripCreate, TripUpdate, TripResponse
from .day import DayCreate, DayUpdate, DayResponse
from .activity import ActivityCreate, ActivityUpdate, ActivityResponse
from .accommodation import AccommodationCreate, AccommodationUpdate, AccommodationResponse
from .flight import FlightCreate, FlightUpdate, FlightResponse
from .transport import TransportCreate, TransportUpdate, TransportResponse
from .packing_item import PackingItemCreate, PackingItemUpdate, PackingItemResponse
from .budget import BudgetCreate, BudgetUpdate, BudgetResponse