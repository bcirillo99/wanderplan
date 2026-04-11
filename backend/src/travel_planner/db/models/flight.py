# backend/src/travel_planner/db/models/flight.py
import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Boolean, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base
from travel_planner.db.enums import Status


class Flight(Base):
    __tablename__ = "flights"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False
    )
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    departure_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    arrival_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    airline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    flight_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    baggage_included: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    status: Mapped[Status | None] = mapped_column(SAEnum(Status, values_callable=lambda x: [e.value for e in x]), nullable=True)
    cost: Mapped[float | None] = mapped_column(nullable=True)
    pay_method: Mapped[str | None] = mapped_column(String(255), nullable=True)
    booking_reference: Mapped[str | None] = mapped_column(String(50), nullable=True)
    link: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    trip: Mapped["Trip"] = relationship(back_populates="flights")