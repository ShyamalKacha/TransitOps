from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    license_number: str
    license_category: Optional[str] = None
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: float
    status: str
    created_at: datetime
    updated_at: datetime


class StatusUpdate(BaseModel):
    status: Literal["available", "off_duty", "suspended"]
    reason: str = Field(min_length=3, max_length=255)


class ScoreUpdate(BaseModel):
    safety_score: float = Field(ge=0, le=100)
    reason: str = Field(min_length=3, max_length=255)


class LicenseUpdate(BaseModel):
    license_expiry_date: date
    reason: str = Field(min_length=3, max_length=255)