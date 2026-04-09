# backend/src/travel_planner/services/packing_item_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import PackingItem
from travel_planner.schemas import PackingItemCreate, PackingItemUpdate


def get_all(db: Session) -> list[PackingItem]:
    return db.query(PackingItem).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[PackingItem]:
    return db.query(PackingItem).filter(PackingItem.trip_id == trip_id).all()

def get_by_id(db: Session, packing_item_id: UUID) -> PackingItem | None:
    return db.get(PackingItem, packing_item_id)


def create(db: Session, trip_id: UUID, data: PackingItemCreate) -> PackingItem:
    packing_item = PackingItem(**data.model_dump(), trip_id = trip_id)
    db.add(packing_item)
    db.commit()
    db.refresh(packing_item)
    return packing_item


def update(db: Session, packing_item_id: UUID, data: PackingItemUpdate) -> PackingItem | None:
    packing_item = db.get(PackingItem, packing_item_id)
    if not packing_item:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(packing_item, key, value)
    db.commit()
    db.refresh(packing_item)
    return packing_item


def delete(db: Session, packing_item_id: UUID) -> bool:
    packing_item = db.get(PackingItem, packing_item_id)
    if not packing_item:
        return False
    db.delete(packing_item)
    db.commit()
    return True

def toggle(db: Session, packing_item_id: UUID) -> PackingItem | None:
    packing_item = db.get(PackingItem, packing_item_id)
    if not packing_item:
        return None
    packing_item.checked = not packing_item.checked
    db.commit()
    db.refresh(packing_item)
    return packing_item