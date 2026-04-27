# backend/src/travel_planner/routers/flight_search_router.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/flights", tags=["flight-search"])


class FlightLegResult(BaseModel):
    airline: str
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_time: str
    arrival_time: str
    duration_minutes: int


class FlightSearchResult(BaseModel):
    price: float | None
    currency: str | None
    duration_minutes: int
    stops: int
    legs: list[FlightLegResult]


@router.get("/search", response_model=list[FlightSearchResult])
def search_flights(
    origin: str = Query(..., min_length=2, max_length=4),
    destination: str = Query(..., min_length=2, max_length=4),
    date: str = Query(..., description="YYYY-MM-DD"),
    cabin: str = Query("economy"),
):
    try:
        from fli.search import SearchFlights
        from fli.models import (
            Airport,
            FlightSearchFilters,
            FlightSegment,
            PassengerInfo,
            SeatType,
            SortBy,
        )
    except ImportError:
        raise HTTPException(status_code=503, detail="Flight search library not available")

    cabin_map = {
        "economy": SeatType.ECONOMY,
        "premium_economy": SeatType.PREMIUM_ECONOMY,
        "business": SeatType.BUSINESS,
        "first": SeatType.FIRST,
    }
    seat_type = cabin_map.get(cabin.lower(), SeatType.ECONOMY)

    try:
        dep_airport = Airport[origin.upper()]
        arr_airport = Airport[destination.upper()]
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"Unknown airport code: {exc}") from exc

    filters = FlightSearchFilters(
        passenger_info=PassengerInfo(adults=1),
        flight_segments=[
            FlightSegment(
                departure_airport=[[dep_airport, 0]],
                arrival_airport=[[arr_airport, 0]],
                travel_date=date,
            )
        ],
        seat_type=seat_type,
        sort_by=SortBy.CHEAPEST,
    )

    try:
        results = SearchFlights().search(filters, top_n=10)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Flight search failed: {exc}") from exc

    if not results:
        return []

    output = []
    for flight in results:
        legs = []
        for leg in flight.legs:
            dep_dt = leg.departure_datetime
            arr_dt = leg.arrival_datetime
            airline_name = (
                leg.airline.value
                if hasattr(leg.airline, "value")
                else str(leg.airline)
            )
            dep_code = (
                leg.departure_airport.name
                if hasattr(leg.departure_airport, "name")
                else str(leg.departure_airport)
            )
            arr_code = (
                leg.arrival_airport.name
                if hasattr(leg.arrival_airport, "name")
                else str(leg.arrival_airport)
            )
            legs.append(
                FlightLegResult(
                    airline=airline_name,
                    flight_number=leg.flight_number or "",
                    departure_airport=dep_code,
                    arrival_airport=arr_code,
                    departure_time=dep_dt.isoformat() if dep_dt else "",
                    arrival_time=arr_dt.isoformat() if arr_dt else "",
                    duration_minutes=leg.duration or 0,
                )
            )
        output.append(
            FlightSearchResult(
                price=flight.price,
                currency=getattr(flight, "currency", None),
                duration_minutes=flight.duration or 0,
                stops=flight.stops or 0,
                legs=legs,
            )
        )

    return output
