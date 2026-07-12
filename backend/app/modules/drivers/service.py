import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import DriverStatus
from app.common.exceptions import BadRequest, Conflict, NotFound
from app.modules.drivers.models import Driver


async def get_drivers(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    license_expiry: Optional[bool] = None,
) -> list[Driver]:
    query = select(Driver)

    if status:
        query = query.where(Driver.status == status)
    if license_expiry:
        query = query.where(Driver.license_expiry_date <= func.now())

    query = query.order_by(Driver.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_driver(db: AsyncSession, driver_id: uuid.UUID) -> Driver:
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise NotFound("Driver not found")
    return driver


async def create_driver(db: AsyncSession, data: dict) -> Driver:
    existing = await db.execute(
        select(Driver).where(Driver.license_number == data["license_number"])
    )
    if existing.scalar_one_or_none():
        raise Conflict("Driver with this license number already exists")

    driver = Driver(**data)
    db.add(driver)
    await db.flush()
    await db.refresh(driver)
    return driver


async def update_driver(
    db: AsyncSession, driver_id: uuid.UUID, data: dict
) -> Driver:
    driver = await get_driver(db, driver_id)

    if (
        "license_number" in data
        and data["license_number"] != driver.license_number
    ):
        existing = await db.execute(
            select(Driver).where(
                Driver.license_number == data["license_number"]
            )
        )
        if existing.scalar_one_or_none():
            raise Conflict("Driver with this license number already exists")

    for key, value in data.items():
        if value is not None:
            setattr(driver, key, value)

    await db.flush()
    await db.refresh(driver)
    return driver


async def delete_driver(db: AsyncSession, driver_id: uuid.UUID) -> None:
    driver = await get_driver(db, driver_id)
    await db.delete(driver)
    await db.flush()


async def change_status(
    db: AsyncSession, driver_id: uuid.UUID, new_status: str
) -> Driver:
    valid_statuses = {s.value for s in DriverStatus}
    if new_status not in valid_statuses:
        raise BadRequest(
            f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}"
        )

    driver = await get_driver(db, driver_id)
    driver.status = new_status
    await db.flush()
    await db.refresh(driver)
    return driver


async def update_safety_score(
    db: AsyncSession, driver_id: uuid.UUID, new_score: float
) -> Driver:
    driver = await get_driver(db, driver_id)
    driver.safety_score = new_score
    await db.flush()
    await db.refresh(driver)
    return driver
