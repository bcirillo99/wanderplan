# backend/src/travel_planner/services/expense_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Expense
from travel_planner.schemas import ExpenseCreate, ExpenseUpdate


def get_all(db: Session) -> list[Expense]:
    return db.query(Expense).all()

def get_all_by_trip(db: Session, trip_id: UUID) -> list[Expense]:
    return db.query(Expense).filter(Expense.trip_id == trip_id).all()

def get_by_id(db: Session, expense_id: UUID) -> Expense | None:
    return db.get(Expense, expense_id)


def create(db: Session, trip_id: UUID, data: ExpenseCreate) -> Expense:
    expense = Expense(**data.model_dump(), trip_id = trip_id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update(db: Session, expense_id: UUID, data: ExpenseUpdate) -> Expense | None:
    expense = db.get(Expense, expense_id)
    if not expense:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete(db: Session, expense_id: UUID) -> bool:
    expense = db.get(Expense, expense_id)
    if not expense:
        return False
    db.delete(expense)
    db.commit()
    return True