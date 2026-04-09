# backend/src/travel_planner/routers/packing_item_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import PackingItemCreate, PackingItemUpdate, PackingItemResponse
from travel_planner.services import packing_item_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/packing_items", tags=["packing_items"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_packing_item_or_404(packing_item_id: UUID, trip_id: UUID, db: Session):
    packing_item = packing_item_service.get_by_id(db, packing_item_id)
    if not packing_item or packing_item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="PackingItem not found")
    return packing_item


@router.get("/", response_model=list[PackingItemResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return packing_item_service.get_all_by_trip(db, trip_id)


@router.get("/{packing_item_id}", response_model=PackingItemResponse)
def get_by_id(trip_id: UUID, packing_item_id: UUID, db: Session = Depends(get_db)):
    return get_packing_item_or_404(packing_item_id, trip_id, db)


@router.post("/", response_model=PackingItemResponse, status_code=201)
def create(trip_id: UUID, data: PackingItemCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return packing_item_service.create(db, trip_id, data)


@router.patch("/{packing_item_id}", response_model=PackingItemResponse)
def update(trip_id: UUID, packing_item_id: UUID, data: PackingItemUpdate, db: Session = Depends(get_db)):
    get_packing_item_or_404(packing_item_id, trip_id, db)
    return packing_item_service.update(db, packing_item_id, data)


@router.delete("/{packing_item_id}", status_code=204)
def delete(trip_id: UUID, packing_item_id: UUID, db: Session = Depends(get_db)):
    get_packing_item_or_404(packing_item_id, trip_id, db)
    packing_item_service.delete(db, packing_item_id)

@router.patch("/{packing_item_id}/toggle", response_model=PackingItemResponse)
def toggle(trip_id: UUID, packing_item_id: UUID, db: Session = Depends(get_db)):
    get_packing_item_or_404(packing_item_id, trip_id, db)
    return packing_item_service.toggle(db, packing_item_id)