# backend/src/travel_planner/db/models/transport.py
import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base
from travel_planner.db.enums import Status, TransportType


class Transport(Base):
    __tablename__ = "transports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False
    )
    transport_type: Mapped[TransportType] = mapped_column(SAEnum(TransportType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    departure_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    arrival_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[Status | None] = mapped_column(
        SAEnum(Status, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    cost: Mapped[float | None] = mapped_column(nullable=True)
    pay_method: Mapped[str | None] = mapped_column(String(255), nullable=True)
    link: Mapped[str | None] = mapped_column(Text, nullable=True)
    operator: Mapped[str | None] = mapped_column(String(255), nullable=True)
    booking_reference: Mapped[str | None] = mapped_column(String(50), nullable=True)
    extra_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    trip: Mapped["Trip"] = relationship(back_populates="transports")