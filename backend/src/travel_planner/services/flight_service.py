# backend/src/travel_planner/services/flight_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Flight
from travel_planner.schemas import FlightCreate, FlightUpdate


def get_all(db: Session) -> list[Flight]:
    return db.query(Flight).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Flight]:
    return db.query(Flight).filter(Flight.trip_id == trip_id).all()

def get_by_id(db: Session, flight_id: UUID) -> Flight | None:
    return db.get(Flight, flight_id)


def create(db: Session, trip_id: UUID, data: FlightCreate) -> Flight:
    flight = Flight(**data.model_dump(), trip_id = trip_id)
    db.add(flight)
    db.commit()
    db.refresh(flight)
    return flight


def update(db: Session, flight_id: UUID, data: FlightUpdate) -> Flight | None:
    flight = db.get(Flight, flight_id)
    if not flight:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(flight, key, value)
    db.commit()
    db.refresh(flight)
    return flight


def delete(db: Session, flight_id: UUID) -> bool:
    flight = db.get(Flight, flight_id)
    if not flight:
        return False
    db.delete(flight)
    db.commit()
    return True