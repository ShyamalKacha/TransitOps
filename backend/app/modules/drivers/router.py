import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.modules.drivers import service as drivers_service
from app.modules.drivers.schemas import (
    DriverCreate,
    DriverOut,
    DriverStatusUpdate,
    DriverUpdate,
    SafetyScoreUpdate,
)

router = APIRouter()


@router.get("", response_model=list[DriverOut])
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    license_expiry: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager", "dispatcher", "safety_officer")),
):
    return await drivers_service.get_drivers(
        db, skip=skip, limit=limit, status=status, license_expiry=license_expiry
    )


@router.get("/{driver_id}", response_model=DriverOut)
async def get_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager", "dispatcher", "safety_officer")),
):
    return await drivers_service.get_driver(db, driver_id)


@router.post("", response_model=DriverOut, status_code=201)
async def create_driver(
    body: DriverCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    return await drivers_service.create_driver(db, body.model_dump())


@router.put("/{driver_id}", response_model=DriverOut)
async def update_driver(
    driver_id: uuid.UUID,
    body: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    return await drivers_service.update_driver(
        db, driver_id, body.model_dump(exclude_unset=True)
    )


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    await drivers_service.delete_driver(db, driver_id)


@router.patch("/{driver_id}/status", response_model=DriverOut)
async def change_driver_status(
    driver_id: uuid.UUID,
    body: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("safety_officer")),
):
    return await drivers_service.change_status(db, driver_id, body.status)


@router.patch("/{driver_id}/safety-score", response_model=DriverOut)
async def update_driver_safety_score(
    driver_id: uuid.UUID,
    body: SafetyScoreUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("safety_officer")),
):
    return await drivers_service.update_safety_score(db, driver_id, body.safety_score)
