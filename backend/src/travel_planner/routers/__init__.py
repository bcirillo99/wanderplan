# backend/src/travel_planner/routers/__init__.py
from .trip_router import router as trip_router
from .activity_router import router as activity_router
from .accommodation_router import router as accommodation_router
from .flight_router import router as flight_router
from .transport_router import router as transport_router
from .packing_item_router import router as packing_item_router
from .extra_router import router as extra_router
from .stats_router import router as stats_router
from .note_router import router as note_router