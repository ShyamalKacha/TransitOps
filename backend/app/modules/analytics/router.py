from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.utils import generate_csv
from app.database import get_db
from app.dependencies import require_roles
from app.modules.analytics import service
from app.modules.analytics.schemas import (
    CostBreakdown,
    DashboardResponse,
    DriverTripItem,
    FuelCostItem,
    FuelEfficiencyItem,
    ProfitPerTrip,
    VehicleROI,
)

router = APIRouter()


# ── Dashboard ───────────────────────────────────────────────────────────


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Aggregated operations dashboard. Requires fleet_manager (or admin)."""
    return await service.get_dashboard(db)


# ── Fuel efficiency ─────────────────────────────────────────────────────


@router.get("/fuel-efficiency", response_model=list[FuelEfficiencyItem])
async def get_fuel_efficiency(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """km/L per vehicle from completed trips. Requires financial_analyst."""
    return await service.get_fuel_efficiency(db)


# ── Fleet utilisation ───────────────────────────────────────────────────


@router.get("/fleet-utilization")
async def get_fleet_utilization(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Detailed fleet utilisation breakdown. Requires financial_analyst."""
    return await service.get_fleet_utilization(db)


# ── Operational cost ────────────────────────────────────────────────────


@router.get("/operational-cost", response_model=CostBreakdown)
async def get_operational_cost(
    month: int | None = Query(None, ge=1, le=12, description="Month (1-12); defaults to current"),
    year: int | None = Query(None, ge=2000, description="Year; defaults to current"),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Monthly cost breakdown: fuel + maintenance + toll. Requires financial_analyst."""
    return await service.get_operational_cost(db, month=month, year=year)


# ── Vehicle ROI ─────────────────────────────────────────────────────────


@router.get("/vehicle-roi", response_model=list[VehicleROI])
async def get_vehicle_roi(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Return on investment per vehicle. Requires financial_analyst."""
    return await service.get_vehicle_roi(db)


# ── Profit per trip ─────────────────────────────────────────────────────


@router.get("/profit-per-trip", response_model=list[ProfitPerTrip])
async def get_profit_per_trip(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Profit breakdown per completed trip. Requires financial_analyst."""
    return await service.get_profit_per_trip(db)


# ── Fuel cost ───────────────────────────────────────────────────────────


@router.get("/fuel-cost", response_model=list[FuelCostItem])
async def get_fuel_cost(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Average km/L and cost/km per vehicle. Requires financial_analyst."""
    return await service.get_fuel_cost(db)


# ── Driver trips ────────────────────────────────────────────────────────


@router.get("/driver-trips", response_model=list[DriverTripItem])
async def get_driver_trips(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("driver")),
):
    """Trips for the currently authenticated driver. Requires driver role."""
    driver = await service.lookup_driver_by_user(db, current_user["sub"])
    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found for the current user",
        )
    return await service.get_driver_trips(db, driver.id)


# ── CSV export ──────────────────────────────────────────────────────────


@router.get("/export/csv")
async def export_csv(
    data_type: str = Query(
        "fuel-logs",
        alias="type",
        description="Data type to export: fuel-logs | expenses",
    ),
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Export data as CSV. Requires financial_analyst."""
    from app.modules.fuel_expenses import service as fuel_service

    if data_type == "fuel-logs":
        logs = await fuel_service.get_fuel_logs(db)
        headers = ["ID", "Vehicle ID", "Liters", "Cost/Liter", "Total Cost", "Date", "Notes"]
        rows = [
            [
                str(l.id),
                str(l.vehicle_id),
                str(l.liters),
                str(l.cost_per_liter),
                str(l.total_cost),
                str(l.date),
                l.notes or "",
            ]
            for l in logs
        ]
    elif data_type == "expenses":
        expenses_list = await fuel_service.get_expenses(db)
        headers = ["ID", "Vehicle ID", "Type", "Amount", "Description", "Date"]
        rows = [
            [
                str(e.id),
                str(e.vehicle_id),
                e.type,
                str(e.amount),
                e.description or "",
                str(e.date),
            ]
            for e in expenses_list
        ]
    else:
        raise HTTPException(status_code=400, detail=f"Unknown export type: {data_type}")

    csv_content = generate_csv(headers, rows)
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={data_type}.csv"},
    )


# ── PDF export (stub) ───────────────────────────────────────────────────


@router.get("/export/pdf")
async def export_pdf(
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """Placeholder PDF export — returns a stub message."""
    return await service.export_pdf()
