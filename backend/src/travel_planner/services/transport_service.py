# backend/src/travel_planner/services/transport_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Transport
from travel_planner.schemas import TransportCreate, TransportUpdate


def get_all(db: Session) -> list[Transport]:
    return db.query(Transport).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Transport]:
    return db.query(Transport).filter(Transport.trip_id == trip_id).all()

def get_by_id(db: Session, transport_id: UUID) -> Transport | None:
    return db.get(Transport, transport_id)


def create(db: Session, trip_id: UUID, data: TransportCreate) -> Transport:
    transport = Transport(**data.model_dump(), trip_id = trip_id)
    db.add(transport)
    db.commit()
    db.refresh(transport)
    return transport


def update(db: Session, transport_id: UUID, data: TransportUpdate) -> Transport | None:
    transport = db.get(Transport, transport_id)
    if not transport:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(transport, key, value)
    if (
        transport.departure_time
        and transport.arrival_time
        and transport.arrival_time < transport.departure_time
    ):
        db.rollback()
        raise ValueError("arrival_time must be after departure_time")
    db.commit()
    db.refresh(transport)
    return transport


def delete(db: Session, transport_id: UUID) -> bool:
    transport = db.get(Transport, transport_id)
    if not transport:
        return False
    db.delete(transport)
    db.commit()
    return True