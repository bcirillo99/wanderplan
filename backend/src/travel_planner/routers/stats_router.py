# backend/src/travel_planner/routers/stats_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.services import trip_service, day_service
from travel_planner.services.stats_service import get_trip_cost_summary, get_day_cost_summary

router = APIRouter(prefix="/trips", tags=["stats"])


@router.get("/{trip_id}/stats")
def trip_stats(trip_id: UUID, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return get_trip_cost_summary(db, trip_id)


@router.get("/{trip_id}/days/{day_id}/stats")
def day_stats(trip_id: UUID, day_id: UUID, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    day = day_service.get_by_id(db, day_id)
    if not day or day.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Day not found")
    return get_day_cost_summary(db, day_id)