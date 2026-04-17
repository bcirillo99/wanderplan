# backend/src/travel_planner/services/extra_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Extra
from travel_planner.schemas import ExtraCreate, ExtraUpdate


def get_all(db: Session) -> list[Extra]:
    return db.query(Extra).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Extra]:
    return db.query(Extra).filter(Extra.trip_id == trip_id).all()

def get_by_id(db: Session, extra_id: UUID) -> Extra | None:
    return db.get(Extra, extra_id)


def create(db: Session, trip_id: UUID, data: ExtraCreate) -> Extra:
    extra = Extra(**data.model_dump(), trip_id=trip_id)
    db.add(extra)
    db.commit()
    db.refresh(extra)
    return extra


def update(db: Session, extra_id: UUID, data: ExtraUpdate) -> Extra | None:
    extra = db.get(Extra, extra_id)
    if not extra:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(extra, key, value)
    db.commit()
    db.refresh(extra)
    return extra


def delete(db: Session, extra_id: UUID) -> bool:
    extra = db.get(Extra, extra_id)
    if not extra:
        return False
    db.delete(extra)
    db.commit()
    return True
