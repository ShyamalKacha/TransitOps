import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.common.utils import utcnow


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    registration_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(100), nullable=False)
    max_load_capacity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    odometer: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    acquisition_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="available"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=utcnow
    )
