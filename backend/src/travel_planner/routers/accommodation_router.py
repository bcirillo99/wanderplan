# backend/src/travel_planner/routers/accommodation_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import AccommodationCreate, AccommodationUpdate, AccommodationResponse
from travel_planner.services import accommodation_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/accommodations", tags=["accommodations"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_accommodation_or_404(accommodation_id: UUID, trip_id: UUID, db: Session):
    accommodation = accommodation_service.get_by_id(db, accommodation_id)
    if not accommodation or accommodation.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    return accommodation


@router.get("/", response_model=list[AccommodationResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return accommodation_service.get_all_by_trip(db, trip_id)


@router.get("/{accommodation_id}", response_model=AccommodationResponse)
def get_by_id(trip_id: UUID, accommodation_id: UUID, db: Session = Depends(get_db)):
    return get_accommodation_or_404(accommodation_id, trip_id, db)


@router.post("/", response_model=AccommodationResponse, status_code=201)
def create(trip_id: UUID, data: AccommodationCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return accommodation_service.create(db, trip_id, data)


@router.patch("/{accommodation_id}", response_model=AccommodationResponse)
def update(trip_id: UUID, accommodation_id: UUID, data: AccommodationUpdate, db: Session = Depends(get_db)):
    get_accommodation_or_404(accommodation_id, trip_id, db)
    return accommodation_service.update(db, accommodation_id, data)


@router.delete("/{accommodation_id}", status_code=204)
def delete(trip_id: UUID, accommodation_id: UUID, db: Session = Depends(get_db)):
    get_accommodation_or_404(accommodation_id, trip_id, db)
    accommodation_service.delete(db, accommodation_id)