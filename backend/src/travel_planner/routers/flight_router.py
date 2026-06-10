# backend/src/travel_planner/routers/flight_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import FlightCreate, FlightUpdate, FlightResponse
from travel_planner.services import flight_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/flights", tags=["flights"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_flight_or_404(flight_id: UUID, trip_id: UUID, db: Session):
    flight = flight_service.get_by_id(db, flight_id)
    if not flight or flight.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@router.get("/", response_model=list[FlightResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return flight_service.get_all_by_trip(db, trip_id)


@router.get("/{flight_id}", response_model=FlightResponse)
def get_by_id(trip_id: UUID, flight_id: UUID, db: Session = Depends(get_db)):
    return get_flight_or_404(flight_id, trip_id, db)


@router.post("/", response_model=FlightResponse, status_code=201)
def create(trip_id: UUID, data: FlightCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return flight_service.create(db, trip_id, data)


@router.patch("/{flight_id}", response_model=FlightResponse)
def update(trip_id: UUID, flight_id: UUID, data: FlightUpdate, db: Session = Depends(get_db)):
    get_flight_or_404(flight_id, trip_id, db)
    try:
        return flight_service.update(db, flight_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.delete("/{flight_id}", status_code=204)
def delete(trip_id: UUID, flight_id: UUID, db: Session = Depends(get_db)):
    get_flight_or_404(flight_id, trip_id, db)
    flight_service.delete(db, flight_id)