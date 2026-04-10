from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import ActivityCreate, ActivityUpdate, ActivityResponse
from travel_planner.services import activity_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/activities", tags=["activities"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_activity_or_404(activity_id: UUID, trip_id: UUID, db: Session):
    activity = activity_service.get_by_id(db, activity_id)
    if not activity or activity.day.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.get("/", response_model=list[ActivityResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return activity_service.get_all_by_trip(db, trip_id)


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_by_id(trip_id: UUID, activity_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return get_activity_or_404(activity_id, trip_id, db)


@router.post("/", response_model=ActivityResponse, status_code=201)
def create(trip_id: UUID, data: ActivityCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return activity_service.create(db, trip_id, data.day_date, data)


@router.patch("/{activity_id}", response_model=ActivityResponse)
def update(trip_id: UUID, activity_id: UUID, data: ActivityUpdate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_activity_or_404(activity_id, trip_id, db)
    return activity_service.update(db, activity_id, data)


@router.delete("/{activity_id}", status_code=204)
def delete(trip_id: UUID, activity_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_activity_or_404(activity_id, trip_id, db)
    activity_service.delete(db, activity_id)