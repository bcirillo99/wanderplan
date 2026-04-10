# backend/src/travel_planner/db/models/trip.py

import uuid
from datetime import date
from sqlalchemy import String, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    activities: Mapped[list["Activity"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    flights: Mapped[list["Flight"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    accommodations: Mapped[list["Accommodation"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    transports: Mapped[list["Transport"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    packing_items: Mapped[list["PackingItem"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="trip", cascade="all, delete-orphan")