import uuid
from sqlalchemy import Column, String, Date, DateTime, Numeric, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    license_category = Column(String(50))
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String(20))
    safety_score = Column(Numeric(5, 2), default=100.00)
    status = Column(String(20), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "driver_safety_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"))
    action = Column(String(50), nullable=False)
    old_value = Column(String(100))
    new_value = Column(String(100))
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())