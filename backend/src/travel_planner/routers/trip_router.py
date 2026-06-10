# backend/src/travel_planner/routers/trip_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import TripCreate, TripUpdate, TripResponse
from travel_planner.services import trip_service

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=list[TripResponse])
def get_all(db: Session = Depends(get_db)):
    return trip_service.get_all(db)


@router.get("/{trip_id}", response_model=TripResponse)
def get_by_id(trip_id: UUID, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/", response_model=TripResponse, status_code=201)
def create(data: TripCreate, db: Session = Depends(get_db)):
    return trip_service.create(db, data)


@router.patch("/{trip_id}", response_model=TripResponse)
def update(
    trip_id: UUID,
    data: TripUpdate,
    confirm: bool = Query(False, description="Required to proceed when date change cascades deletes"),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # If the patch changes dates, preview which related items would be cascaded.
    # Block the update unless the caller passes ?confirm=true so the UI can
    # surface what's about to be deleted.
    new_start = data.start_date or trip.start_date
    new_end = data.end_date or trip.end_date
    dates_changing = (
        (data.start_date is not None and data.start_date != trip.start_date)
        or (data.end_date is not None and data.end_date != trip.end_date)
    )

    if dates_changing and new_start and new_end and not confirm:
        preview = trip_service.preview_entities_outside_range(db, trip_id, new_start, new_end)
        total = sum(len(v) for v in preview.values())
        if total > 0:
            return JSONResponse(
                status_code=409,
                content={
                    "detail": "Date change would delete related items. Re-send with ?confirm=true to proceed.",
                    "deletions": preview,
                    "total": total,
                },
            )

    updated = trip_service.update(db, trip_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Trip not found")
    return updated


@router.delete("/{trip_id}", status_code=204)
def delete(trip_id: UUID, db: Session = Depends(get_db)):
    deleted = trip_service.delete(db, trip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")