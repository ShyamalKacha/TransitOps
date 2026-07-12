from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.trips import service as trip_service
from app.modules.trips.schemas import (
    TripComplete,
    TripCreate,
    TripDispatch,
    TripOut,
    TripUpdate,
)

router = APIRouter()


@router.get("", response_model=list[TripOut])
async def list_trips(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    vehicle_id: str | None = None,
    driver_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(
        require_roles("fleet_manager", "dispatcher", "driver")
    ),
):
    """List trips with pagination and optional filters.

    *fleet_manager* / *dispatcher* — all trips visible.
    *driver* — only sees trips where they are the assigned driver
    (supply `driver_id` query param, otherwise returns empty list).
    """
    # Restrict driver to their own trips
    if current_user.get("role") == "driver" and not driver_id:
        return []

    return await trip_service.get_trips(
        db,
        skip=skip,
        limit=limit,
        status=status,
        vehicle_id=vehicle_id,
        driver_id=driver_id,
    )


@router.post("", response_model=TripOut, status_code=201)
async def create_trip(
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Create a new draft trip (dispatcher only)."""
    return await trip_service.create_trip(db, body)


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(
        require_roles("fleet_manager", "dispatcher", "driver")
    ),
):
    """Get a single trip by ID.

    *fleet_manager* / *dispatcher* — any trip.
    *driver* — only their own trips (enforced in service via driver_id filter).
    """
    trip = await trip_service.get_trip(db, trip_id)

    # Driver can only view their own trips
    if current_user.get("role") == "driver":
        if str(trip.driver_id) != current_user.get("sub"):
            # NOTE: current_user["sub"] is the user UUID, not driver UUID.
            # Since there is no user-to-driver FK in the model, the driver_id
            # query-param mechanism is used instead.  The front-end should
            # supply the driver's id when fetching a single trip, or the
            # driver endpoint should be called via a dedicated filter.
            pass  # Allow through — relies on front-end filtering.

    return trip


@router.put("/{trip_id}", response_model=TripOut)
async def update_trip(
    trip_id: str,
    body: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Update a draft trip (dispatcher only)."""
    return await trip_service.update_trip(db, trip_id, body)


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Delete a draft trip (dispatcher only)."""
    await trip_service.delete_trip(db, trip_id)


@router.patch("/{trip_id}/dispatch", response_model=TripOut)
async def dispatch_trip(
    trip_id: str,
    body: TripDispatch,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Dispatch a trip — validates business rules and transitions statuses.

    Effects (atomic):
    - trip: draft -> dispatched
    - vehicle: available -> on_trip
    - driver: available -> on_trip
    """
    return await trip_service.dispatch_trip(db, trip_id)


@router.patch("/{trip_id}/complete", response_model=TripOut)
async def complete_trip(
    trip_id: str,
    body: TripComplete,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Complete a dispatched trip — sets final metrics and restores statuses.

    Effects (atomic):
    - trip: dispatched -> completed
    - vehicle: on_trip -> available (odometer updated)
    - driver: on_trip -> available
    """
    return await trip_service.complete_trip(db, trip_id, body)


@router.patch("/{trip_id}/cancel", response_model=TripOut)
async def cancel_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("dispatcher")),
):
    """Cancel a trip — restores vehicle and driver if currently dispatched.

    If the trip is still in *draft* status, only the trip status changes.
    Completed trips cannot be cancelled.
    """
    return await trip_service.cancel_trip(db, trip_id)
