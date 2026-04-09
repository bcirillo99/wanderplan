# backend/src/travel_planner/services/budget_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Budget
from travel_planner.schemas import BudgetCreate, BudgetUpdate


def get_all(db: Session) -> list[Budget]:
    return db.query(Budget).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Budget]:
    return db.query(Budget).filter(Budget.trip_id == trip_id).all()

def get_by_id(db: Session, budget_id: UUID) -> Budget | None:
    return db.get(Budget, budget_id)


def create(db: Session, trip_id: UUID, data: BudgetCreate) -> Budget:
    budget = Budget(**data.model_dump(), trip_id = trip_id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def update(db: Session, budget_id: UUID, data: BudgetUpdate) -> Budget | None:
    budget = db.get(Budget, budget_id)
    if not budget:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)
    db.commit()
    db.refresh(budget)
    return budget


def delete(db: Session, budget_id: UUID) -> bool:
    budget = db.get(Budget, budget_id)
    if not budget:
        return False
    db.delete(budget)
    db.commit()
    return True