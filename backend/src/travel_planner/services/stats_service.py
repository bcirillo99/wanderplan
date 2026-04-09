# backend/src/travel_planner/services/stats_service.py
from uuid import UUID
from sqlalchemy.orm import Session
from travel_planner.db.models import Trip, Flight, Transport, Accommodation, Activity, Expense


def get_trip_cost_summary(db: Session, trip_id: UUID) -> dict:
    """
    Returns a cost summary for a trip broken down by category.
    Includes both estimated and actual costs where available.
    """
    flights = db.query(Flight).filter(Flight.trip_id == trip_id).all()
    transports = db.query(Transport).filter(Transport.trip_id == trip_id).all()
    accommodations = db.query(Accommodation).filter(Accommodation.trip_id == trip_id).all()
    activities = db.query(Activity).join(Activity.day).filter_by(trip_id=trip_id).all()
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()

    flight_total = sum(f.cost for f in flights if f.cost)
    transport_total = sum(t.cost for t in transports if t.cost)
    accommodation_total = sum(
        a.cost_per_night * (a.check_out - a.check_in).days
        for a in accommodations
        if a.cost_per_night and a.check_in and a.check_out
    )
    activity_total = sum(a.cost for a in activities if a.cost)
    expense_total = sum(e.amount for e in expenses if e.amount)

    total = flight_total + transport_total + accommodation_total + activity_total + expense_total

    return {
        "flights": flight_total,
        "transport": transport_total,
        "accommodation": accommodation_total,
        "activities": activity_total,
        "expenses": expense_total,
        "total": total,
    }


def get_day_cost_summary(db: Session, day_id: UUID) -> dict:
    """
    Returns the total cost of all activities for a given day.
    """
    activities = db.query(Activity).filter(Activity.day_id == day_id).all()
    total = sum(a.cost for a in activities if a.cost)
    return {
        "activities": total,
        "total": total,
    }