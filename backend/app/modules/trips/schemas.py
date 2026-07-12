from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: str
    driver_id: str
    cargo_weight: Decimal | None = None
    planned_distance: Decimal | None = None
    notes: str | None = None


class TripUpdate(BaseModel):
    source: str | None = None
    destination: str | None = None
    vehicle_id: str | None = None
    driver_id: str | None = None
    cargo_weight: Decimal | None = None
    planned_distance: Decimal | None = None
    notes: str | None = None


class TripDispatch(BaseModel):
    """Empty body — dispatch requires no extra data beyond the trip ID in the URL."""
    pass


class TripComplete(BaseModel):
    final_odometer: Decimal
    fuel_consumed: Decimal
    revenue: Decimal
    driver_earnings: Decimal
    actual_distance: Decimal


class TripOut(BaseModel):
    id: str
    source: str
    destination: str
    vehicle_id: str
    driver_id: str
    cargo_weight: Decimal | None = None
    planned_distance: Decimal | None = None
    actual_distance: Decimal | None = None
    status: str
    dispatched_at: datetime | None = None
    completed_at: datetime | None = None
    final_odometer: Decimal | None = None
    fuel_consumed: Decimal | None = None
    revenue: Decimal | None = None
    driver_earnings: Decimal | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
