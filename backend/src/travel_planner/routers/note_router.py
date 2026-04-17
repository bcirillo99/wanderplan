from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import NoteCreate, NoteUpdate, NoteResponse
from travel_planner.services import note_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/notes", tags=["notes"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_note_or_404(note_id: UUID, trip_id: UUID, db: Session):
    note = note_service.get_by_id(db, note_id)
    if not note or note.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.get("/", response_model=list[NoteResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return note_service.get_all_by_trip(db, trip_id)


@router.get("/{note_id}", response_model=NoteResponse)
def get_by_id(trip_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return get_note_or_404(note_id, trip_id, db)


@router.post("/", response_model=NoteResponse, status_code=201)
def create(trip_id: UUID, data: NoteCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return note_service.create(db, trip_id, data)


@router.patch("/{note_id}", response_model=NoteResponse)
def update(trip_id: UUID, note_id: UUID, data: NoteUpdate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_note_or_404(note_id, trip_id, db)
    return note_service.update(db, note_id, data)


@router.delete("/{note_id}", status_code=204)
def delete(trip_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_note_or_404(note_id, trip_id, db)
    note_service.delete(db, note_id)
