# backend/src/travel_planner/routers/expense_router.py
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from travel_planner.db.session import get_db
from travel_planner.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from travel_planner.services import expense_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/expenses", tags=["expenses"])


def get_trip_or_404(trip_id: UUID, db: Session):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_expense_or_404(expense_id: UUID, trip_id: UUID, db: Session):
    expense = expense_service.get_by_id(db, expense_id)
    if not expense or expense.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.get("/", response_model=list[ExpenseResponse])
def get_all(trip_id: UUID, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return expense_service.get_all_by_trip(db, trip_id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_by_id(trip_id: UUID, expense_id: UUID, db: Session = Depends(get_db)):
    return get_expense_or_404(expense_id, trip_id, db)


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create(trip_id: UUID, data: ExpenseCreate, db: Session = Depends(get_db)):
    get_trip_or_404(trip_id, db)
    return expense_service.create(db, trip_id, data)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update(trip_id: UUID, expense_id: UUID, data: ExpenseUpdate, db: Session = Depends(get_db)):
    get_expense_or_404(expense_id, trip_id, db)
    return expense_service.update(db, expense_id, data)


@router.delete("/{expense_id}", status_code=204)
def delete(trip_id: UUID, expense_id: UUID, db: Session = Depends(get_db)):
    get_expense_or_404(expense_id, trip_id, db)
    expense_service.delete(db, expense_id)