# backend/src/travel_planner/db/models/accommodation.py
import uuid
from travel_planner.db import AccommodationType, Status
from datetime import date
from sqlalchemy import ForeignKey, String, Date, Text, Float, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base


class Accommodation(Base):
    __tablename__ = "accommodations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False
    )
    accommodation_type: Mapped[AccommodationType | None] = mapped_column(SAEnum(AccommodationType, values_callable=lambda x: [e.value for e in x]), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    check_in: Mapped[date | None] = mapped_column(Date, nullable=True)
    check_out: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[Status | None] = mapped_column(SAEnum(Status, values_callable=lambda x: [e.value for e in x]), nullable=True)
    cost_per_night: Mapped[float | None] = mapped_column(nullable=True)
    pay_method: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cancellation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    link: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    booking_reference: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    trip: Mapped["Trip"] = relationship(back_populates="accommodations")