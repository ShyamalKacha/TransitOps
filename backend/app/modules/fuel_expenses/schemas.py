from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class FuelLogCreate(BaseModel):
    vehicle_id: UUID
    driver_id: UUID | None = None
    liters: Decimal
    cost_per_liter: Decimal
    date: date
    notes: str | None = None


class FuelLogOut(BaseModel):
    id: UUID
    vehicle_id: UUID
    driver_id: UUID | None
    liters: Decimal
    cost_per_liter: Decimal
    total_cost: Decimal
    date: date
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseCreate(BaseModel):
    vehicle_id: UUID
    type: str
    amount: Decimal
    description: str | None = None
    date: date


class ExpenseOut(BaseModel):
    id: UUID
    vehicle_id: UUID
    type: str
    amount: Decimal
    description: str | None
    date: date
    created_at: datetime

    model_config = {"from_attributes": True}
