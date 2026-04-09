# TODO: stats_service.py
# - get_day_cost(db, day_id) -> float
#   Sum of all activity costs for a given day
#
# - get_trip_cost(db, trip_id) -> float
#   Sum of all costs across activities, flights, accommodations, transports
#
# - get_budget_summary(db, trip_id) -> dict
#   Compare estimated vs actual budget entries
#
# - get_full_trip(db, trip_id) -> Trip
#   Load a trip with all related entities in a single query (joinedload)
#   See: https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html#joined-eager-loading
#
# Note: implement after routers are working