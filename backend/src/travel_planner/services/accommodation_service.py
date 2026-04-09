# backend/src/travel_planner/services/accommodation_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Accommodation
from travel_planner.schemas import AccommodationCreate, AccommodationUpdate


def get_all(db: Session) -> list[Accommodation]:
    return db.query(Accommodation).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Accommodation]:
    return db.query(Accommodation).filter(Accommodation.trip_id == trip_id).all()

def get_by_id(db: Session, accommodation_id: UUID) -> Accommodation | None:
    return db.get(Accommodation, accommodation_id)


def create(db: Session, trip_id: UUID, data: AccommodationCreate) -> Accommodation:
    accommodation = Accommodation(**data.model_dump(), trip_id = trip_id)
    db.add(accommodation)
    db.commit()
    db.refresh(accommodation)
    return accommodation


def update(db: Session, accommodation_id: UUID, data: AccommodationUpdate) -> Accommodation | None:
    accommodation = db.get(Accommodation, accommodation_id)
    if not accommodation:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(accommodation, key, value)
    db.commit()
    db.refresh(accommodation)
    return accommodation


def delete(db: Session, accommodation_id: UUID) -> bool:
    accommodation = db.get(Accommodation, accommodation_id)
    if not accommodation:
        return False
    db.delete(accommodation)
    db.commit()
    return True