from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.utils import generate_csv


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


async def get_dashboard(db: AsyncSession) -> dict:
    """Aggregated metrics for the operations dashboard.

    Returns vehicle-status counts, active/pending trip counts, drivers on duty,
    and fleet utilization percentage.
    """
    # Lazy imports so this module does not crash at import time when sibling
    # modules (vehicles, trips, drivers) are stubs.
    from app.modules.vehicles.models import Vehicle
    from app.modules.trips.models import Trip
    from app.modules.drivers.models import Driver
    from app.common.enums import VehicleStatus, TripStatus, DriverStatus

    # -- Vehicle status counts (single GROUP BY) --
    status_rows = await db.execute(
        select(Vehicle.status, func.count(Vehicle.id)).group_by(Vehicle.status)
    )
    status_counts: dict[str, int] = dict(status_rows.all())

    # -- Active trips (dispatched == in progress) --
    active = await db.execute(
        select(func.count(Trip.id)).where(Trip.status == TripStatus.DISPATCHED.value)
    )
    active_trips = active.scalar() or 0

    # -- Pending trips (draft == not yet dispatched) --
    pending = await db.execute(
        select(func.count(Trip.id)).where(Trip.status == TripStatus.DRAFT.value)
    )
    pending_trips = pending.scalar() or 0

    # -- Drivers currently on duty --
    duty = await db.execute(
        select(func.count(Driver.id)).where(
            Driver.status.in_([DriverStatus.AVAILABLE.value, DriverStatus.ON_TRIP.value])
        )
    )
    drivers_on_duty = duty.scalar() or 0

    # -- Fleet utilisation % --
    total_active = await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.status != VehicleStatus.RETIRED.value)
    )
    total = total_active.scalar() or 0

    on_trip = await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.ON_TRIP.value)
    )
    on_trip_count = on_trip.scalar() or 0

    fleet_utilization = round(on_trip_count / total * 100, 2) if total > 0 else 0.0

    return {
        "vehicle_status_counts": status_counts,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization": fleet_utilization,
    }


# ---------------------------------------------------------------------------
# Fuel efficiency
# ---------------------------------------------------------------------------


async def get_fuel_efficiency(db: AsyncSession) -> list[dict]:
    """For each vehicle, compute km/L from completed trips."""
    from app.modules.vehicles.models import Vehicle
    from app.modules.trips.models import Trip
    from app.common.enums import TripStatus

    rows = await db.execute(
        select(
            Vehicle.name,
            Vehicle.registration_number,
            func.sum(Trip.actual_distance).label("total_distance"),
            func.sum(Trip.fuel_consumed).label("total_fuel"),
        )
        .join(Trip, Trip.vehicle_id == Vehicle.id)
        .where(Trip.status == TripStatus.COMPLETED.value)
        .group_by(Vehicle.id, Vehicle.name, Vehicle.registration_number)
        .having(func.sum(Trip.fuel_consumed) > 0)
    )

    items = []
    for row in rows:
        total_km = float(row.total_distance) if row.total_distance else 0
        total_l = float(row.total_fuel) if row.total_fuel else 0
        kmpl = round(total_km / total_l, 2) if total_l > 0 else 0.0
        items.append(
            {
                "vehicle_name": row.name,
                "registration_number": row.registration_number,
                "km_per_liter": kmpl,
            }
        )
    return items


# ---------------------------------------------------------------------------
# Fleet utilisation
# ---------------------------------------------------------------------------


async def get_fleet_utilization(db: AsyncSession) -> dict:
    """Detailed fleet utilisation: on-trip / (total - retired) * 100."""
    from app.modules.vehicles.models import Vehicle
    from app.common.enums import VehicleStatus

    total = (await db.execute(select(func.count(Vehicle.id)))).scalar() or 0
    retired = (
        await db.execute(
            select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.RETIRED.value)
        )
    ).scalar() or 0
    on_trip = (
        await db.execute(
            select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.ON_TRIP.value)
        )
    ).scalar() or 0

    active_fleet = total - retired
    pct = round(on_trip / active_fleet * 100, 2) if active_fleet > 0 else 0.0

    return {
        "total_vehicles": total,
        "retired": retired,
        "active_fleet": active_fleet,
        "on_trip": on_trip,
        "utilization_percent": pct,
    }


# ---------------------------------------------------------------------------
# Fuel cost analysis  (avg km/L + cost/km per vehicle)
# ---------------------------------------------------------------------------


async def get_fuel_cost(db: AsyncSession) -> list[dict]:
    """Average km/L and cost per km per vehicle from completed trips."""
    from app.modules.vehicles.models import Vehicle
    from app.modules.trips.models import Trip
    from app.modules.fuel_expenses.models import FuelLog
    from app.common.enums import TripStatus

    # Average cost-per-liter per vehicle from fuel logs
    avg_cost_subq = (
        select(
            FuelLog.vehicle_id,
            func.avg(FuelLog.cost_per_liter).label("avg_cost_per_liter"),
        )
        .group_by(FuelLog.vehicle_id)
        .subquery()
    )

    rows = await db.execute(
        select(
            Vehicle.name,
            Vehicle.registration_number,
            func.sum(Trip.actual_distance).label("total_distance"),
            func.sum(Trip.fuel_consumed).label("total_fuel"),
            avg_cost_subq.c.avg_cost_per_liter,
        )
        .join(Trip, Trip.vehicle_id == Vehicle.id)
        .outerjoin(avg_cost_subq, avg_cost_subq.c.vehicle_id == Vehicle.id)
        .where(Trip.status == TripStatus.COMPLETED.value)
        .group_by(
            Vehicle.id,
            Vehicle.name,
            Vehicle.registration_number,
            avg_cost_subq.c.avg_cost_per_liter,
        )
        .having(func.sum(Trip.fuel_consumed) > 0)
    )

    items = []
    for row in rows:
        total_km = float(row.total_distance) if row.total_distance else 0
        total_l = float(row.total_fuel) if row.total_fuel else 0
        avg_cost = float(row.avg_cost_per_liter) if row.avg_cost_per_liter else 0

        kmpl = round(total_km / total_l, 2) if total_l > 0 else 0.0
        cpk = round(avg_cost / kmpl, 2) if kmpl > 0 else 0.0

        items.append(
            {
                "vehicle_name": row.name,
                "registration_number": row.registration_number,
                "avg_km_per_liter": kmpl,
                "avg_cost_per_km": cpk,
            }
        )
    return items


# ---------------------------------------------------------------------------
# Operational cost (monthly)
# ---------------------------------------------------------------------------


async def get_operational_cost(
    db: AsyncSession,
    month: int | None = None,
    year: int | None = None,
) -> dict:
    """Monthly fuel + closed-maintenance + toll costs."""
    from app.modules.fuel_expenses.models import FuelLog, Expense
    from app.modules.maintenance.models import MaintenanceRecord
    from app.common.enums import MaintenanceStatus, ExpenseType

    today = date.today()
    month = month or today.month
    year = year or today.year

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    fuel = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(FuelLog.total_cost), 0)).where(
                    FuelLog.date >= start, FuelLog.date < end
                )
            )
        ).scalar()
    )

    maintenance = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).where(
                    MaintenanceRecord.status == MaintenanceStatus.CLOSED.value,
                    MaintenanceRecord.created_at >= start,
                    MaintenanceRecord.created_at < end,
                )
            )
        ).scalar()
    )

    toll = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Expense.amount), 0)).where(
                    Expense.type == ExpenseType.TOLL.value,
                    Expense.date >= start,
                    Expense.date < end,
                )
            )
        ).scalar()
    )

    return {
        "fuel": round(fuel, 2),
        "maintenance": round(maintenance, 2),
        "toll": round(toll, 2),
        "total": round(fuel + maintenance + toll, 2),
    }


# ---------------------------------------------------------------------------
# Vehicle ROI
# ---------------------------------------------------------------------------


async def get_vehicle_roi(db: AsyncSession) -> list[dict]:
    """(Total revenue - fuel cost - maintenance) / acquisition_cost * 100 per vehicle."""
    from app.modules.vehicles.models import Vehicle
    from app.modules.trips.models import Trip
    from app.modules.fuel_expenses.models import FuelLog
    from app.modules.maintenance.models import MaintenanceRecord
    from app.common.enums import TripStatus, MaintenanceStatus

    # Revenue per vehicle (completed trips only)
    rev_subq = (
        select(
            Trip.vehicle_id,
            func.sum(Trip.revenue).label("total_revenue"),
        )
        .where(Trip.status == TripStatus.COMPLETED.value)
        .group_by(Trip.vehicle_id)
        .subquery()
    )

    # Fuel cost per vehicle
    fuel_subq = (
        select(
            FuelLog.vehicle_id,
            func.sum(FuelLog.total_cost).label("total_fuel"),
        )
        .group_by(FuelLog.vehicle_id)
        .subquery()
    )

    # Maintenance cost per vehicle (closed records only)
    maint_subq = (
        select(
            MaintenanceRecord.vehicle_id,
            func.sum(MaintenanceRecord.cost).label("total_maintenance"),
        )
        .where(MaintenanceRecord.status == MaintenanceStatus.CLOSED.value)
        .group_by(MaintenanceRecord.vehicle_id)
        .subquery()
    )

    rows = await db.execute(
        select(
            Vehicle.name,
            Vehicle.registration_number,
            Vehicle.acquisition_cost,
            func.coalesce(rev_subq.c.total_revenue, 0).label("total_revenue"),
            func.coalesce(fuel_subq.c.total_fuel, 0).label("total_fuel"),
            func.coalesce(maint_subq.c.total_maintenance, 0).label("total_maintenance"),
        )
        .outerjoin(rev_subq, rev_subq.c.vehicle_id == Vehicle.id)
        .outerjoin(fuel_subq, fuel_subq.c.vehicle_id == Vehicle.id)
        .outerjoin(maint_subq, maint_subq.c.vehicle_id == Vehicle.id)
    )

    items = []
    for row in rows:
        revenue = float(row.total_revenue)
        fuel_cost = float(row.total_fuel)
        maint_cost = float(row.total_maintenance)
        acquisition = float(row.acquisition_cost) if row.acquisition_cost else 0

        net = revenue - fuel_cost - maint_cost
        roi = round(net / acquisition * 100, 2) if acquisition > 0 else 0.0

        items.append(
            {
                "vehicle_name": row.name,
                "registration_number": row.registration_number,
                "roi": roi,
            }
        )
    return items


# ---------------------------------------------------------------------------
# Profit per trip
# ---------------------------------------------------------------------------


async def get_profit_per_trip(db: AsyncSession) -> list[dict]:
    """Per completed trip: revenue - (fuel_consumed * avg_cost_per_liter)."""
    from app.modules.trips.models import Trip
    from app.modules.fuel_expenses.models import FuelLog
    from app.common.enums import TripStatus

    # Average fuel cost per vehicle from fuel_logs
    avg_fuel_subq = (
        select(
            FuelLog.vehicle_id,
            func.avg(FuelLog.cost_per_liter).label("avg_cost_per_liter"),
        )
        .group_by(FuelLog.vehicle_id)
        .subquery()
    )

    rows = await db.execute(
        select(
            Trip.id,
            Trip.source,
            Trip.destination,
            Trip.revenue,
            Trip.fuel_consumed,
            Trip.vehicle_id,
            avg_fuel_subq.c.avg_cost_per_liter,
        )
        .outerjoin(avg_fuel_subq, avg_fuel_subq.c.vehicle_id == Trip.vehicle_id)
        .where(Trip.status == TripStatus.COMPLETED.value)
    )

    items = []
    for row in rows:
        revenue = float(row.revenue) if row.revenue else 0
        fuel_l = float(row.fuel_consumed) if row.fuel_consumed else 0
        avg_cost = float(row.avg_cost_per_liter) if row.avg_cost_per_liter else 0

        fuel_cost = round(fuel_l * avg_cost, 2)
        total_cost = fuel_cost  # trip-level maintenance/expense linkage TBD
        profit = round(revenue - total_cost, 2)

        items.append(
            {
                "trip_id": str(row.id),
                "source": row.source,
                "destination": row.destination,
                "revenue": revenue,
                "total_cost": total_cost,
                "profit": profit,
            }
        )
    return items


# ---------------------------------------------------------------------------
# Driver-specific trips
# ---------------------------------------------------------------------------


async def lookup_driver_by_user(db: AsyncSession, user_id: str) -> object | None:
    """Return the Driver record linked to the given auth user ID, or None."""
    from app.modules.drivers.models import Driver

    result = await db.execute(select(Driver).where(Driver.user_id == user_id))
    return result.scalar_one_or_none()


async def get_driver_trips(db: AsyncSession, driver_id: UUID) -> list[dict]:
    """Return all trips for a driver with vehicle details and earnings."""
    from app.modules.vehicles.models import Vehicle
    from app.modules.trips.models import Trip

    rows = await db.execute(
        select(
            Trip.id,
            Vehicle.name.label("vehicle_name"),
            Vehicle.registration_number,
            Trip.source,
            Trip.destination,
            Trip.status,
            Trip.revenue,
        )
        .join(Vehicle, Vehicle.id == Trip.vehicle_id)
        .where(Trip.driver_id == driver_id)
        .order_by(Trip.created_at.desc())
    )

    items = []
    for row in rows:
        rev = float(row.revenue) if row.revenue else 0
        items.append(
            {
                "trip_id": str(row.id),
                "vehicle_name": row.vehicle_name,
                "registration_number": row.registration_number,
                "source": row.source,
                "destination": row.destination,
                "status": row.status,
                "revenue": rev,
                "earnings": rev,  # placeholder — revenue currently stands in as earnings
            }
        )
    return items


# ---------------------------------------------------------------------------
# Export utilities
# ---------------------------------------------------------------------------


def export_csv(headers: list[str], rows: list[list]) -> str:
    """Generate a CSV string from a header list and a list of row lists."""
    return generate_csv(headers, rows)


async def export_pdf() -> dict:
    """Stub — PDF generation is not yet implemented."""
    return {
        "message": "PDF export is not yet implemented. This is a placeholder.",
        "status": "stub",
    }
