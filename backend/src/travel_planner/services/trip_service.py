# backend/src/travel_planner/services/trip_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.enums import DEFAULT_PACKING_ITEMS, PackingCategory
from travel_planner.db.models import Trip
from travel_planner.db.models.packing_item import PackingItem
from travel_planner.schemas import TripCreate, TripUpdate

from datetime import date
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.orm import Session

def cleanup_trip_related_entities_outside_range(
    db: Session,
    trip_id: UUID,
    start_date: date,
    end_date: date,
) -> None:
    params = {
        "trip_id": str(trip_id),
        "start_date": start_date,
        "end_date": end_date,
    }

    db.execute(
        text("""
            DELETE FROM activities
            WHERE trip_id = :trip_id
              AND activity_date IS NOT NULL
              AND (
                activity_date < :start_date
                OR activity_date > :end_date
              )
        """),
        params,
    )

    db.execute(
        text("""
            DELETE FROM flights
            WHERE trip_id = :trip_id
              AND departure_time IS NOT NULL
              AND (
                DATE(departure_time) < :start_date
                OR DATE(departure_time) > :end_date
              )
        """),
        params,
    )

    db.execute(
        text("""
            DELETE FROM transports
            WHERE trip_id = :trip_id
              AND departure_time IS NOT NULL
              AND (
                DATE(departure_time) < :start_date
                OR DATE(departure_time) > :end_date
              )
        """),
        params,
    )

    db.execute(
        text("""
            DELETE FROM accommodations
            WHERE trip_id = :trip_id
              AND check_in IS NOT NULL
              AND check_out IS NOT NULL
              AND (
                DATE(check_out) < :start_date
                OR DATE(check_in) > :end_date
              )
        """),
        params,
    )


def get_all(db: Session) -> list[Trip]:
    return db.query(Trip).all()


def get_by_id(db: Session, trip_id: UUID) -> Trip | None:
    return db.get(Trip, trip_id)

def create(db: Session, data: TripCreate) -> Trip:
    dump = data.model_dump()
    trip = Trip(**dump)
    db.add(trip)
    db.flush()  # ottieni l'id prima del commit

    for item in DEFAULT_PACKING_ITEMS:
        packing_item = PackingItem(
            trip_id=trip.id,
            name=item["name"],
            category=PackingCategory(item["category"]),
            checked=False,
        )
        db.add(packing_item)

    db.commit()
    db.refresh(trip)
    return trip


def update(db: Session, trip_id: UUID, data: TripUpdate) -> Trip | None:
    trip = db.get(Trip, trip_id)
    if not trip:
        return None
    old_start_date = trip.start_date
    old_end_date = trip.end_date

    payload = data.model_dump(exclude_unset=True)

    for key, value in payload.items():
        setattr(trip, key, value)

    new_start_date = trip.start_date
    new_end_date = trip.end_date

    dates_changed = (
        old_start_date != new_start_date or old_end_date != new_end_date
    )

    if dates_changed and new_start_date and new_end_date:
        cleanup_trip_related_entities_outside_range(
            db=db,
            trip_id=trip_id,
            start_date=new_start_date,
            end_date=new_end_date,
        )

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