# backend/src/travel_planner/db/models/budget.py
import uuid
from sqlalchemy import ForeignKey, String, Text, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from travel_planner.db.base import Base
from travel_planner.db import BudgetCategory


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False
    )
    category: Mapped[BudgetCategory | None] = mapped_column(SAEnum(BudgetCategory), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actual_amount: Mapped[float | None] = mapped_column(nullable=True)


    # relationships
    trip: Mapped["Trip"] = relationship(back_populates="budgets")