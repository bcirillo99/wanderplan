# backend/src/travel_planner/main.py
from fastapi import FastAPI
from travel_planner.routers import (
    trip_router,
    day_router,
    activity_router,
    accommodation_router,
    flight_router,
    transport_router,
    packing_item_router,
    expense_router,
)

app = FastAPI(title="Wanderplan API")

app.include_router(trip_router)
app.include_router(day_router)
app.include_router(activity_router)
app.include_router(accommodation_router)
app.include_router(flight_router)
app.include_router(transport_router)
app.include_router(packing_item_router)
app.include_router(expense_router)