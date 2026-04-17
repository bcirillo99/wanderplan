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
    OTHER = "other"


class TransportType(enum.Enum):
    TRAIN = "train"
    BUS = "bus"
    CAR = "car"
    SHUTTLE = "shuttle"
    FERRY = "ferry"
    TAXI = "taxi"
    OTHER = "other"


class PackingCategory(enum.Enum):
    DOCUMENTS = "documents"
    CLOTHING = "clothing"
    MEDICINE = "medicine"
    TECHNOLOGY = "technology"
    TOILETRIES = "toiletries"
    ACCESSORIES = "accessories"
    FOOD = "food"
    COMFORT = "comfort"
    EXTRAS = "extras"

DEFAULT_PACKING_ITEMS = [
    {"name": "Passport", "category": "documents"},
    {"name": "Air tickets", "category": "documents"},
    {"name": "Travel insurance", "category": "documents"},
    {"name": "Credit cards", "category": "documents"},
    {"name": "Wallet", "category": "documents"},
    {"name": "Cash", "category": "documents"},
    {"name": "Driving license", "category": "documents"},
    {"name": "Copies of important documents", "category": "documents"},
    {"name": "Phone charger", "category": "technology"},
    {"name": "Power bank", "category": "technology"},
    {"name": "Universal adapter", "category": "technology"},
    {"name": "Headphones", "category": "technology"},
    {"name": "Phone", "category": "technology"},
    {"name": "USB cable", "category": "technology"},
    {"name": "E-reader or tablet", "category": "technology"},
    {"name": "Toothbrush and toothpaste", "category": "medicine"},
    {"name": "Paracetamol", "category": "medicine"},
    {"name": "Band-aids", "category": "medicine"},
    {"name": "Sunscreen", "category": "medicine"},
    {"name": "Insect repellent", "category": "medicine"},
    {"name": "Hand sanitizer", "category": "medicine"},
    {"name": "Tissues", "category": "medicine"},
    {"name": "Basic first-aid kit", "category": "medicine"},
    {"name": "Deodorant", "category": "toiletries"},
    {"name": "Shampoo", "category": "toiletries"},
    {"name": "Soap or body wash", "category": "toiletries"},
    {"name": "Razor", "category": "toiletries"},
    {"name": "Hairbrush/comb", "category": "toiletries"},
    {"name": "Sunglasses", "category": "accessories"},
    {"name": "Hat or cap", "category": "accessories"},
    {"name": "Reusable water bottle", "category": "accessories"},
    {"name": "Snacks", "category": "food"},
    {"name": "Sleeping mask", "category": "comfort"},
    {"name": "Earplugs", "category": "comfort"},
    {"name": "Travel pillow", "category": "comfort"},
    {"name": "Light jacket", "category": "clothing"},
    {"name": "Underwear", "category": "clothing"},
    {"name": "Socks", "category": "clothing"},
    {"name": "Camera", "category": "technology"},
    {"name": "Memory cards", "category": "technology"},
    {"name": "Camera charger", "category": "technology"},
]


class ExtraCategory(enum.Enum):
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    ACTIVITIES = "activities"
    FOOD = "food"
    SHOPPING = "shopping"
    OTHER = "other"