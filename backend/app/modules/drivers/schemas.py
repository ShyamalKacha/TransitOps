from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    user_id: Optional[str] = None
    safety_score: Optional[Decimal] = Decimal("100.00")
    status: Optional[str] = "available"


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    user_id: Optional[str] = None


class DriverOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DriverStatusUpdate(BaseModel):
    status: str


class SafetyScoreUpdate(BaseModel):
    safety_score: Decimal
