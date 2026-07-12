from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.modules.fuel_expenses import service
from app.modules.fuel_expenses.schemas import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut

# Separate routers so main.py can mount them at different prefixes.
fuel_logs_router = APIRouter()
expenses_router = APIRouter()

# Compatibility alias (used by any code importing router from this package).
router = fuel_logs_router


# ── Fuel Log endpoints (mounted at /api/fuel-logs) ──────────────────────


@fuel_logs_router.get("", response_model=list[FuelLogOut])
async def list_fuel_logs(
    vehicle_id: UUID | None = Query(None, description="Filter by vehicle ID"),
    date_from: date | None = Query(None, description="Filter start date (inclusive)"),
    date_to: date | None = Query(None, description="Filter end date (inclusive)"),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """List fuel log entries. Requires financial_analyst role (or admin)."""
    return await service.get_fuel_logs(
        db, vehicle_id=vehicle_id, date_from=date_from, date_to=date_to
    )


@fuel_logs_router.post("", response_model=FuelLogOut, status_code=201)
async def create_fuel_log(
    body: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Record a fuel purchase. Requires fleet_manager role (or admin)."""
    return await service.create_fuel_log(db, body)


# ── Expense endpoints (mounted at /api/expenses) ───────────────────────


@expenses_router.get("", response_model=list[ExpenseOut])
async def list_expenses(
    vehicle_id: UUID | None = Query(None, description="Filter by vehicle ID"),
    expense_type: str | None = Query(
        None, alias="type", description="Filter by expense type (toll / maintenance / other)"
    ),
    date_from: date | None = Query(None, description="Filter start date (inclusive)"),
    date_to: date | None = Query(None, description="Filter end date (inclusive)"),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("financial_analyst")),
):
    """List expense entries. Requires financial_analyst role (or admin)."""
    return await service.get_expenses(
        db,
        vehicle_id=vehicle_id,
        expense_type=expense_type,
        date_from=date_from,
        date_to=date_to,
    )


@expenses_router.post("", response_model=ExpenseOut, status_code=201)
async def create_expense(
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_roles("fleet_manager")),
):
    """Record an expense (toll / maintenance / other). Requires fleet_manager role (or admin)."""
    return await service.create_expense(db, body)
