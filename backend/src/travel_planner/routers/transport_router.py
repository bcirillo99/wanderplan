# backend/src/travel_planner/routers/transport_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import TransportCreate, TransportUpdate, TransportResponse
from travel_planner.services import transport_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/transports", tags=["transports"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_transport_or_404(transport_id: UUID, trip_id: UUID, db: Session):
    transport = transport_service.get_by_id(db, transport_id)
    if not transport or transport.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Transport not found")
    return transport


@router.get("/", response_model=list[TransportResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return transport_service.get_all_by_trip(db, trip_id)


@router.get("/{transport_id}", response_model=TransportResponse)
def get_by_id(trip_id: UUID, transport_id: UUID, db: Session = Depends(get_db)):
    return get_transport_or_404(transport_id, trip_id, db)


@router.post("/", response_model=TransportResponse, status_code=201)
def create(trip_id: UUID, data: TransportCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return transport_service.create(db, trip_id, data)


@router.patch("/{transport_id}", response_model=TransportResponse)
def update(trip_id: UUID, transport_id: UUID, data: TransportUpdate, db: Session = Depends(get_db)):
    get_transport_or_404(transport_id, trip_id, db)
    return transport_service.update(db, transport_id, data)


@router.delete("/{transport_id}", status_code=204)
def delete(trip_id: UUID, transport_id: UUID, db: Session = Depends(get_db)):
    get_transport_or_404(transport_id, trip_id, db)
    transport_service.delete(db, transport_id)