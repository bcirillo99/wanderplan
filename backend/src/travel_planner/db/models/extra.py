# backend/src/travel_planner/db/models/extra.py
import uuid
from sqlalchemy import ForeignKey, String, Text, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base
from travel_planner.db import ExtraCategory


class Extra(Base):
    __tablename__ = "extras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[ExtraCategory | None] = mapped_column(SAEnum(ExtraCategory, values_callable=lambda x: [e.value for e in x]), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actual_amount: Mapped[float | None] = mapped_column(nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True, default="EUR")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    trip: Mapped["Trip"] = relationship(back_populates="extras")
