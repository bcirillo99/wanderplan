# backend/src/travel_planner/services/note_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Note
from travel_planner.schemas import NoteCreate, NoteUpdate


def get_all_by_trip(db: Session, trip_id: UUID) -> list[Note]:
    return db.query(Note).filter(Note.trip_id == trip_id).order_by(Note.created_at.desc()).all()


def get_by_id(db: Session, note_id: UUID) -> Note | None:
    return db.get(Note, note_id)


def create(db: Session, trip_id: UUID, data: NoteCreate) -> Note:
    note = Note(**data.model_dump(), trip_id=trip_id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def update(db: Session, note_id: UUID, data: NoteUpdate) -> Note | None:
    note = db.get(Note, note_id)
    if not note:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(note, key, value)
    db.commit()
    db.refresh(note)
    return note


def delete(db: Session, note_id: UUID) -> bool:
    note = db.get(Note, note_id)
    if not note:
        return False
    db.delete(note)
    db.commit()
    return True
