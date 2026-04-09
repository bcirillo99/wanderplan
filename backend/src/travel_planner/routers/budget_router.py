# backend/src/travel_planner/routers/budget_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from travel_planner.services import budget_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/budgets", tags=["budgets"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_budget_or_404(budget_id: UUID, trip_id: UUID, db: Session):
    budget = budget_service.get_by_id(db, budget_id)
    if not budget or budget.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.get("/", response_model=list[BudgetResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return budget_service.get_all_by_trip(db, trip_id)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_by_id(trip_id: UUID, budget_id: UUID, db: Session = Depends(get_db)):
    return get_budget_or_404(budget_id, trip_id, db)


@router.post("/", response_model=BudgetResponse, status_code=201)
def create(trip_id: UUID, data: BudgetCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return budget_service.create(db, trip_id, data)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update(trip_id: UUID, budget_id: UUID, data: BudgetUpdate, db: Session = Depends(get_db)):
    get_budget_or_404(budget_id, trip_id, db)
    return budget_service.update(db, budget_id, data)


@router.delete("/{budget_id}", status_code=204)
def delete(trip_id: UUID, budget_id: UUID, db: Session = Depends(get_db)):
    get_budget_or_404(budget_id, trip_id, db)
    budget_service.delete(db, budget_id)