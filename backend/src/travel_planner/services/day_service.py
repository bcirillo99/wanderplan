# backend/src/travel_planner/services/day_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Day
from travel_planner.schemas import DayCreate, DayUpdate
from datetime import date


def get_all(db: Session) -> list[Day]:
    return db.query(Day).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Day]:
    return db.query(Day).filter(Day.trip_id == trip_id).all()

def get_by_id(db: Session, day_id: UUID) -> Day | None:
    return db.get(Day, day_id)

def get_by_date(db: Session, trip_id: UUID, day_date: date) -> Day | None:
    return db.query(Day).filter(
        Day.trip_id == trip_id,
        Day.day_date == day_date
    ).first()


def get_or_create_day(db: Session, trip_id: UUID, day_date: date) -> Day:
    day = get_by_date(db, trip_id, day_date)
    if not day:
        day = Day(trip_id=trip_id, day_date=day_date)
        db.add(day)
        db.commit()
        db.refresh(day)
    return day


def create(db: Session, trip_id: UUID, data: DayCreate) -> Day:
    day = Day(**data.model_dump(), trip_id = trip_id)
    db.add(day)
    db.commit()
    db.refresh(day)
    return day


def update(db: Session, day_id: UUID, data: DayUpdate) -> Day | None:
    day = db.get(Day, day_id)
    if not day:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(day, key, value)
    db.commit()
    db.refresh(day)
    return day


def delete(db: Session, day_id: UUID) -> bool:
    day = db.get(Day, day_id)
    if not day:
        return False
    db.delete(day)
    db.commit()
    return True