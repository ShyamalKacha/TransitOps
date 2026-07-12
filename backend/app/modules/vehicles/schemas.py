from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class VehicleCreate(BaseModel):
    registration_number: str
    name: str
    model: str
    vehicle_type: str
    max_load_capacity: Decimal
    odometer: Optional[Decimal] = Decimal("0.00")
    acquisition_cost: Decimal
    status: Optional[str] = "available"


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name: Optional[str] = None
    model: Optional[str] = None
    vehicle_type: Optional[str] = None
    max_load_capacity: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    acquisition_cost: Optional[Decimal] = None


class VehicleOut(BaseModel):
    id: UUID
    registration_number: str
    name: str
    model: str
    vehicle_type: str
    max_load_capacity: Decimal
    odometer: Decimal
    acquisition_cost: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleStatusUpdate(BaseModel):
    status: str
