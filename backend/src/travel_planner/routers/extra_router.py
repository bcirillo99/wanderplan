from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import ExtraCreate, ExtraUpdate, ExtraResponse
from travel_planner.services import extra_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/extras", tags=["extras"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_extra_or_404(extra_id: UUID, trip_id: UUID, db: Session):
    extra = extra_service.get_by_id(db, extra_id)
    if not extra or extra.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Extra not found")
    return extra


@router.get("/", response_model=list[ExtraResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return extra_service.get_all_by_trip(db, trip_id)


@router.get("/{extra_id}", response_model=ExtraResponse)
def get_by_id(trip_id: UUID, extra_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return get_extra_or_404(extra_id, trip_id, db)


@router.post("/", response_model=ExtraResponse, status_code=201)
def create(trip_id: UUID, data: ExtraCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return extra_service.create(db, trip_id, data)


@router.patch("/{extra_id}", response_model=ExtraResponse)
def update(trip_id: UUID, extra_id: UUID, data: ExtraUpdate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_extra_or_404(extra_id, trip_id, db)
    return extra_service.update(db, extra_id, data)


@router.delete("/{extra_id}", status_code=204)
def delete(trip_id: UUID, extra_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    get_extra_or_404(extra_id, trip_id, db)
    extra_service.delete(db, extra_id)
