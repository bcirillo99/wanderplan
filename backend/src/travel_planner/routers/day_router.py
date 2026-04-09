# backend/src/travel_planner/routers/day_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import DayCreate, DayUpdate, DayResponse
from travel_planner.services import day_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/days", tags=["days"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_day_or_404(day_id: UUID, trip_id: UUID, db: Session):
    day = day_service.get_by_id(db, day_id)
    if not day or day.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Day not found")
    return day


@router.get("/", response_model=list[DayResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return day_service.get_all_by_trip(db, trip_id)


@router.get("/{day_id}", response_model=DayResponse)
def get_by_id(trip_id: UUID, day_id: UUID, db: Session = Depends(get_db)):
    return get_day_or_404(day_id, trip_id, db)


@router.post("/", response_model=DayResponse, status_code=201)
def create(trip_id: UUID, data: DayCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return day_service.create(db, trip_id, data)


@router.patch("/{day_id}", response_model=DayResponse)
def update(trip_id: UUID, day_id: UUID, data: DayUpdate, db: Session = Depends(get_db)):
    get_day_or_404(day_id, trip_id, db)
    return day_service.update(db, day_id, data)


@router.delete("/{day_id}", status_code=204)
def delete(trip_id: UUID, day_id: UUID, db: Session = Depends(get_db)):
    get_day_or_404(day_id, trip_id, db)
    day_service.delete(db, day_id)