from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str
    type: str | None = None
    cost: Decimal | None = None
    scheduled_date: date | None = None
    notes: str | None = None


class MaintenanceUpdate(BaseModel):
    description: str | None = None
    type: str | None = None
    cost: Decimal | None = None
    scheduled_date: date | None = None
    notes: str | None = None


class MaintenanceClose(BaseModel):
    """Optional details when closing a maintenance record."""
    cost: Decimal | None = None
    notes: str | None = None


class MaintenanceOut(BaseModel):
    id: str
    vehicle_id: str
    description: str
    type: str | None = None
    cost: Decimal | None = None
    status: str
    scheduled_date: date | None = None
    completed_date: date | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
