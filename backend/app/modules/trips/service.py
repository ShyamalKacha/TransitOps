import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.common.enums import DriverStatus, TripStatus, VehicleStatus
from app.common.exceptions import BadRequest, NotFound
from app.modules.drivers.models import Driver
from app.modules.trips.models import Trip
from app.modules.vehicles.models import Vehicle


async def get_trips(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    vehicle_id: str | None = None,
    driver_id: str | None = None,
) -> list[Trip]:
    """List trips with optional pagination and filters."""
    query = select(Trip).order_by(Trip.created_at.desc())

    if status:
        query = query.where(Trip.status == status)
    if vehicle_id:
        query = query.where(Trip.vehicle_id == uuid.UUID(vehicle_id))
    if driver_id:
        query = query.where(Trip.driver_id == uuid.UUID(driver_id))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_trip(db: AsyncSession, trip_id: str) -> Trip:
    """Get a single trip by ID."""
    result = await db.execute(select(Trip).where(Trip.id == uuid.UUID(trip_id)))
    trip = result.scalar_one_or_none()
    if not trip:
        raise NotFound("Trip not found")
    return trip


async def create_trip(db: AsyncSession, data: "TripCreate") -> Trip:
    """Create a new draft trip."""
    trip = Trip(
        source=data.source,
        destination=data.destination,
        vehicle_id=uuid.UUID(data.vehicle_id),
        driver_id=uuid.UUID(data.driver_id),
        cargo_weight=data.cargo_weight,
        planned_distance=data.planned_distance,
        notes=data.notes,
    )
    db.add(trip)
    await db.flush()
    await db.refresh(trip)
    return trip


async def update_trip(db: AsyncSession, trip_id: str, data: "TripUpdate") -> Trip:
    """Update a draft trip. Non-draft trips are immutable via this path."""
    trip = await get_trip(db, trip_id)

    if trip.status != TripStatus.DRAFT.value:
        raise BadRequest("Only draft trips can be edited")

    patch = data.model_dump(exclude_unset=True)
    if "vehicle_id" in patch:
        patch["vehicle_id"] = uuid.UUID(patch["vehicle_id"])
    if "driver_id" in patch:
        patch["driver_id"] = uuid.UUID(patch["driver_id"])

    for field, value in patch.items():
        setattr(trip, field, value)

    await db.flush()
    await db.refresh(trip)
    return trip


async def delete_trip(db: AsyncSession, trip_id: str) -> None:
    """Delete a draft trip."""
    trip = await get_trip(db, trip_id)

    if trip.status != TripStatus.DRAFT.value:
        raise BadRequest("Only draft trips can be deleted")

    await db.delete(trip)
    await db.flush()


async def dispatch_trip(db: AsyncSession, trip_id: str) -> Trip:
    """
    Dispatch a trip: validate business rules and atomically transition
    trip -> dispatched, vehicle -> on_trip, driver -> on_trip.
    """
    trip = await get_trip(db, trip_id)

    if trip.status != TripStatus.DRAFT.value:
        raise BadRequest("Only draft trips can be dispatched")

    # Eagerly load vehicle and driver under row-level locks
    vehicle_result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id == trip.vehicle_id)
        .with_for_update()
    )
    vehicle = vehicle_result.scalar_one_or_none()
    if not vehicle:
        raise NotFound("Referenced vehicle not found")

    driver_result = await db.execute(
        select(Driver)
        .where(Driver.id == trip.driver_id)
        .with_for_update()
    )
    driver = driver_result.scalar_one_or_none()
    if not driver:
        raise NotFound("Referenced driver not found")

    # --- Business rules ---
    if vehicle.status != VehicleStatus.AVAILABLE.value:
        raise BadRequest(
            f"Vehicle is currently '{vehicle.status}' — only 'available' vehicles can be dispatched"
        )
    if driver.status != DriverStatus.AVAILABLE.value:
        raise BadRequest(
            f"Driver is currently '{driver.status}' — only 'available' drivers can be dispatched"
        )
    if driver.license_expiry_date < date.today():
        raise BadRequest(
            f"Driver license expired on {driver.license_expiry_date.isoformat()}"
        )
    if trip.cargo_weight is not None and trip.cargo_weight > vehicle.max_load_capacity:
        raise BadRequest(
            f"Cargo weight ({trip.cargo_weight} kg) exceeds vehicle max load "
            f"capacity ({vehicle.max_load_capacity} kg)"
        )

    # --- Atomic state transition ---
    trip.status = TripStatus.DISPATCHED.value
    trip.dispatched_at = datetime.now(timezone.utc)
    vehicle.status = VehicleStatus.ON_TRIP.value
    driver.status = DriverStatus.ON_TRIP.value

    await db.flush()
    await db.refresh(trip)
    return trip


async def complete_trip(
    db: AsyncSession, trip_id: str, data: "TripComplete"
) -> Trip:
    """
    Complete a dispatched trip: set completion fields, update vehicle odometer,
    and restore both vehicle and driver to available.
    """
    trip = await get_trip(db, trip_id)

    if trip.status != TripStatus.DISPATCHED.value:
        raise BadRequest("Only dispatched trips can be completed")

    vehicle_result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id == trip.vehicle_id)
        .with_for_update()
    )
    vehicle = vehicle_result.scalar_one_or_none()

    driver_result = await db.execute(
        select(Driver)
        .where(Driver.id == trip.driver_id)
        .with_for_update()
    )
    driver = driver_result.scalar_one_or_none()

    # Set completion data
    trip.final_odometer = data.final_odometer
    trip.fuel_consumed = data.fuel_consumed
    trip.revenue = data.revenue
    trip.driver_earnings = data.driver_earnings
    trip.actual_distance = data.actual_distance
    trip.status = TripStatus.COMPLETED.value
    trip.completed_at = datetime.now(timezone.utc)

    # Update vehicle
    if vehicle:
        vehicle.odometer = data.final_odometer
        vehicle.status = VehicleStatus.AVAILABLE.value

    # Update driver
    if driver:
        driver.status = DriverStatus.AVAILABLE.value

    await db.flush()
    await db.refresh(trip)
    return trip


async def cancel_trip(db: AsyncSession, trip_id: str) -> Trip:
    """
    Cancel a trip. If the trip was dispatched, restore vehicle and driver
    to available. Draft trips can also be cancelled without side effects.
    """
    trip = await get_trip(db, trip_id)

    if trip.status == TripStatus.COMPLETED.value:
        raise BadRequest("Completed trips cannot be cancelled")

    # Restore vehicle and driver if currently dispatched
    if trip.status == TripStatus.DISPATCHED.value:
        vehicle_result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id == trip.vehicle_id)
            .with_for_update()
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE.value

        driver_result = await db.execute(
            select(Driver)
            .where(Driver.id == trip.driver_id)
            .with_for_update()
        )
        driver = driver_result.scalar_one_or_none()
        if driver:
            driver.status = DriverStatus.AVAILABLE.value

    trip.status = TripStatus.CANCELLED.value
    await db.flush()
    await db.refresh(trip)
    return trip
