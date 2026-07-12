from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.modules.maintenance import service as maintenance_service
from app.modules.maintenance.schemas import (
    MaintenanceClose,
    MaintenanceCreate,
    MaintenanceOut,
    MaintenanceUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MaintenanceOut])
async def list_records(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(
        require_roles("fleet_manager", "financial_analyst")
    ),
):
    """List maintenance records with pagination and optional filters.

    Visible to *fleet_manager* and *financial_analyst*.
    """
    return await maintenance_service.get_records(
        db,
        skip=skip,
        limit=limit,
        vehicle_id=vehicle_id,
        status=status,
    )


@router.post("", response_model=MaintenanceOut, status_code=201)
async def create_record(
    body: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Create a maintenance record (fleet_manager only).

    Automatically sets the vehicle status to *in_shop*.
    """
    return await maintenance_service.create_record(db, body)


@router.get("/{record_id}", response_model=MaintenanceOut)
async def get_record(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(
        require_roles("fleet_manager", "financial_analyst")
    ),
):
    """Get a single maintenance record by ID."""
    return await maintenance_service.get_record(db, record_id)


@router.put("/{record_id}", response_model=MaintenanceOut)
async def update_record(
    record_id: str,
    body: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Update a maintenance record (fleet_manager only)."""
    return await maintenance_service.update_record(db, record_id, body)


@router.patch("/{record_id}/close", response_model=MaintenanceOut)
async def close_record(
    record_id: str,
    body: MaintenanceClose,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Close a maintenance record (fleet_manager only).

    Restores the vehicle to *available* unless the vehicle is *retired*.
    """
    return await maintenance_service.close_record(db, record_id, body)
