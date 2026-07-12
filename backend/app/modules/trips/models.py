import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.utils import utcnow
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False, index=True
    )
    cargo_weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    planned_distance: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    actual_distance: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )
    dispatched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    final_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    fuel_consumed: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    revenue: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    driver_earnings: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=utcnow
    )
