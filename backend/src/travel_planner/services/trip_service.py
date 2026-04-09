# backend/src/travel_planner/services/trip_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Trip
from travel_planner.schemas import TripCreate, TripUpdate


def get_all(db: Session) -> list[Trip]:
    return db.query(Trip).all()


def get_by_id(db: Session, trip_id: UUID) -> Trip | None:
    return db.get(Trip, trip_id)


def create(db: Session, data: TripCreate) -> Trip:
    trip = Trip(**data.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def update(db: Session, trip_id: UUID, data: TripUpdate) -> Trip | None:
    trip = db.get(Trip, trip_id)
    if not trip:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, key, value)
    db.commit()
    db.refresh(trip)
    return trip


def delete(db: Session, trip_id: UUID) -> bool:
    trip = db.get(Trip, trip_id)
    if not trip:
        return False
    db.delete(trip)
    db.commit()
    return True