# backend/src/travel_planner/routers/stats_router.py
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.services import trip_service, stats_service
from travel_planner.schemas.daily_summary import DailySummaryItem

router = APIRouter(prefix="/trips", tags=["stats"])


@router.get("/{trip_id}/stats")
def trip_stats(trip_id: UUID, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return stats_service.get_trip_cost_summary(db, trip_id)


@router.get("/{trip_id}/days/{activity_date}/stats")
def date_stats(trip_id: UUID, activity_date: date, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return stats_service.get_date_cost_summary(db, trip_id, activity_date)


@router.get("/{trip_id}/days/{summary_date}/summary", response_model=list[DailySummaryItem])
def daily_summary(trip_id: UUID, summary_date: date, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return stats_service.get_daily_summary(db, trip_id, summary_date)