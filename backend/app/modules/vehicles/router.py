import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.modules.vehicles import service as vehicles_service
from app.modules.vehicles.schemas import (
    VehicleCreate,
    VehicleOut,
    VehicleStatusUpdate,
    VehicleUpdate,
)

router = APIRouter()


@router.get("", response_model=list[VehicleOut])
async def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    vehicle_type: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager", "dispatcher")),
):
    return await vehicles_service.get_vehicles(
        db, skip=skip, limit=limit, status=status, vehicle_type=vehicle_type, search=search
    )


@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager", "dispatcher")),
):
    return await vehicles_service.get_vehicle(db, vehicle_id)


@router.post("", response_model=VehicleOut, status_code=201)
async def create_vehicle(
    body: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    return await vehicles_service.create_vehicle(db, body.model_dump())


@router.put("/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    body: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    return await vehicles_service.update_vehicle(
        db, vehicle_id, body.model_dump(exclude_unset=True)
    )


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    await vehicles_service.delete_vehicle(db, vehicle_id)


@router.patch("/{vehicle_id}/status", response_model=VehicleOut)
async def change_vehicle_status(
    vehicle_id: uuid.UUID,
    body: VehicleStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("fleet_manager")),
):
    return await vehicles_service.change_status(db, vehicle_id, body.status)
