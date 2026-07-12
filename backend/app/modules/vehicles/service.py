import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import VehicleStatus
from app.common.exceptions import BadRequest, Conflict, NotFound
from app.modules.vehicles.models import Vehicle


async def get_vehicles(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    search: Optional[str] = None,
) -> list[Vehicle]:
    query = select(Vehicle)

    if status:
        query = query.where(Vehicle.status == status)
    if vehicle_type:
        query = query.where(Vehicle.vehicle_type == vehicle_type)
    if search:
        query = query.where(
            Vehicle.name.ilike(f"%{search}%")
            | Vehicle.registration_number.ilike(f"%{search}%")
            | Vehicle.model.ilike(f"%{search}%")
        )

    query = query.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFound("Vehicle not found")
    return vehicle


async def create_vehicle(db: AsyncSession, data: dict) -> Vehicle:
    existing = await db.execute(
        select(Vehicle).where(Vehicle.registration_number == data["registration_number"])
    )
    if existing.scalar_one_or_none():
        raise Conflict("Vehicle with this registration number already exists")

    vehicle = Vehicle(**data)
    db.add(vehicle)
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def update_vehicle(
    db: AsyncSession, vehicle_id: uuid.UUID, data: dict
) -> Vehicle:
    vehicle = await get_vehicle(db, vehicle_id)

    if (
        "registration_number" in data
        and data["registration_number"] != vehicle.registration_number
    ):
        existing = await db.execute(
            select(Vehicle).where(
                Vehicle.registration_number == data["registration_number"]
            )
        )
        if existing.scalar_one_or_none():
            raise Conflict("Vehicle with this registration number already exists")

    for key, value in data.items():
        if value is not None:
            setattr(vehicle, key, value)

    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def delete_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> None:
    vehicle = await get_vehicle(db, vehicle_id)
    await db.delete(vehicle)
    await db.flush()


async def change_status(
    db: AsyncSession, vehicle_id: uuid.UUID, new_status: str
) -> Vehicle:
    valid_statuses = {s.value for s in VehicleStatus}
    if new_status not in valid_statuses:
        raise BadRequest(
            f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}"
        )

    vehicle = await get_vehicle(db, vehicle_id)
    vehicle.status = new_status
    await db.flush()
    await db.refresh(vehicle)
    return vehicle
