# backend/src/travel_planner/db/enums.py
import enum


class Status(enum.Enum):
    DRAFT = "draft"
    TO_BOOK = "to_book"
    BOOKED = "booked"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class AccommodationType(enum.Enum):
    HOTEL = "hotel"
    HOSTEL = "hostel"
    AIRBNB = "airbnb"
    LODGE = "lodge"
    CAMPING = "camping"
    RESORT = "resort"
    APARTMENT = "apartment"
    EXTRAS = "extras"


class TransportType(enum.Enum):
    TRAIN = "train"
    BUS = "bus"
    CAR = "car"
    SHUTTLE = "shuttle"
    FERRY = "ferry"
    TAXI = "taxi"


class PackingCategory(enum.Enum):
    DOCUMENTS = "documents"
    CLOTHING = "clothing"
    MEDICINE = "medicine"
    TECHNOLOGY = "technology"
    EXTRAS = "extras"


class BudgetCategory(enum.Enum):
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    ACTIVITIES = "activities"
    FOOD = "food"
    SHOPPING = "shopping"
    EXTRAS = "extras"