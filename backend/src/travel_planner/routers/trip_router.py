# backend/src/travel_planner/routers/trip_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import TripCreate, TripUpdate, TripResponse
from travel_planner.services import trip_service

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=list[TripResponse])
def get_all(db: Session = Depends(get_db)):
    return trip_service.get_all(db)


@router.get("/{trip_id}", response_model=TripResponse)
def get_by_id(trip_id: UUID, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/", response_model=TripResponse, status_code=201)
def create(data: TripCreate, db: Session = Depends(get_db)):
    return trip_service.create(db, data)


@router.patch("/{trip_id}", response_model=TripResponse)
def update(trip_id: UUID, data: TripUpdate, db: Session = Depends(get_db)):
    trip = trip_service.update(db, trip_id, data)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/{trip_id}", status_code=204)
def delete(trip_id: UUID, db: Session = Depends(get_db)):
    deleted = trip_service.delete(db, trip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")