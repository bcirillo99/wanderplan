from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from travel_planner.routers import (
    trip_router,
    activity_router,
    accommodation_router,
    flight_router,
    flight_search_router,
    transport_router,
    packing_item_router,
    extra_router,
    stats_router,
    note_router,
)

app = FastAPI(title="Wanderplan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trip_router)
app.include_router(activity_router)
app.include_router(accommodation_router)
app.include_router(flight_router)
app.include_router(flight_search_router)
app.include_router(transport_router)
app.include_router(packing_item_router)
app.include_router(extra_router)
app.include_router(stats_router)
app.include_router(note_router)