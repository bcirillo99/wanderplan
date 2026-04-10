# backend/src/travel_planner/services/activity_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Activity, Day
from travel_planner.schemas import ActivityCreate, ActivityUpdate
from datetime import date
from travel_planner.services import day_service

def get_all(db: Session) -> list[Activity]:
    return db.query(Activity).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Activity]:
    return (
        db.query(Activity)
        .join(Activity.day)
        .filter_by(trip_id=trip_id)
        .all()
    )

def get_all_by_day(db: Session, day_id: UUID) -> list[Activity]:
    return db.query(Activity).filter(Activity.day_id == day_id).all()

def get_by_id(db: Session, activity_id: UUID) -> Activity | None:
    return db.get(Activity, activity_id)


def create(db: Session, trip_id: UUID, day_date: date, data: ActivityCreate) -> Activity:
    day = day_service.get_or_create_day(db, trip_id, day_date)
    activity = Activity(**data.model_dump(exclude={'day_date'}), day_id=day.id)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def update(db: Session, activity_id: UUID, data: ActivityUpdate) -> Activity | None:
    activity = db.get(Activity, activity_id)
    if not activity:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return activity


def delete(db: Session, activity_id: UUID) -> bool:
    activity = db.get(Activity, activity_id)
    if not activity:
        return False
    db.delete(activity)
    db.commit()
    return True