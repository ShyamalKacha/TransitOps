import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import MaintenanceStatus, VehicleStatus
from app.common.exceptions import BadRequest, NotFound
from app.modules.maintenance.models import MaintenanceRecord
from app.modules.vehicles.models import Vehicle


async def get_records(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
    vehicle_id: str | None = None,
    status: str | None = None,
) -> list[MaintenanceRecord]:
    """List maintenance records with optional pagination and filters."""
    query = select(MaintenanceRecord).order_by(
        MaintenanceRecord.created_at.desc()
    )

    if vehicle_id:
        query = query.where(
            MaintenanceRecord.vehicle_id == uuid.UUID(vehicle_id)
        )
    if status:
        query = query.where(MaintenanceRecord.status == status)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_record(db: AsyncSession, record_id: str) -> MaintenanceRecord:
    """Get a single maintenance record by ID."""
    result = await db.execute(
        select(MaintenanceRecord).where(
            MaintenanceRecord.id == uuid.UUID(record_id)
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFound("Maintenance record not found")
    return record


async def create_record(
    db: AsyncSession, data: "MaintenanceCreate"
) -> MaintenanceRecord:
    """
    Create a maintenance record and atomically flip the vehicle
    status to *in_shop*.
    """
    # Validate vehicle exists
    vehicle_result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id == uuid.UUID(data.vehicle_id))
        .with_for_update()
    )
    vehicle = vehicle_result.scalar_one_or_none()
    if not vehicle:
        raise NotFound("Referenced vehicle not found")
    if vehicle.status == VehicleStatus.RETIRED.value:
        raise BadRequest("Cannot create maintenance record for a retired vehicle")

    record = MaintenanceRecord(
        vehicle_id=uuid.UUID(data.vehicle_id),
        description=data.description,
        type=data.type,
        cost=data.cost,
        scheduled_date=data.scheduled_date,
        notes=data.notes,
    )
    db.add(record)

    # Auto-flip vehicle to in_shop (unless already in_shop)
    if vehicle.status != VehicleStatus.IN_SHOP.value:
        vehicle.status = VehicleStatus.IN_SHOP.value

    await db.flush()
    await db.refresh(record)
    return record


async def update_record(
    db: AsyncSession, record_id: str, data: "MaintenanceUpdate"
) -> MaintenanceRecord:
    """Update an existing maintenance record (any status)."""
    record = await get_record(db, record_id)

    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record


async def close_record(
    db: AsyncSession, record_id: str, data: "MaintenanceClose"
) -> MaintenanceRecord:
    """
    Close a maintenance record and restore the vehicle to *available*
    (unless the vehicle has been retired in the meantime).
    """
    record = await get_record(db, record_id)

    if record.status != MaintenanceStatus.OPEN.value:
        raise BadRequest("Maintenance record is already closed")

    # Update the record
    record.status = MaintenanceStatus.CLOSED.value
    record.completed_date = date.today()
    if data.cost is not None:
        record.cost = data.cost
    if data.notes is not None:
        record.notes = data.notes

    # Restore vehicle (only if not retired)
    vehicle_result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id == record.vehicle_id)
        .with_for_update()
    )
    vehicle = vehicle_result.scalar_one_or_none()
    if vehicle and vehicle.status != VehicleStatus.RETIRED.value:
        vehicle.status = VehicleStatus.AVAILABLE.value

    await db.flush()
    await db.refresh(record)
    return record
