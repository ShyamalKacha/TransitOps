from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.fuel_expenses.models import FuelLog, Expense
from app.modules.fuel_expenses.schemas import FuelLogCreate, ExpenseCreate


async def get_fuel_logs(
    db: AsyncSession,
    vehicle_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[FuelLog]:
    """Return fuel log entries, optionally filtered by vehicle and date range."""
    query = select(FuelLog).order_by(FuelLog.date.desc(), FuelLog.created_at.desc())

    if vehicle_id is not None:
        query = query.where(FuelLog.vehicle_id == vehicle_id)
    if date_from is not None:
        query = query.where(FuelLog.date >= date_from)
    if date_to is not None:
        query = query.where(FuelLog.date <= date_to)

    result = await db.execute(query)
    return list(result.scalars().all())


async def create_fuel_log(db: AsyncSession, data: FuelLogCreate) -> FuelLog:
    """Create a new fuel log entry. total_cost is computed from liters * cost_per_liter."""
    total_cost = data.liters * data.cost_per_liter
    log = FuelLog(
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        liters=data.liters,
        cost_per_liter=data.cost_per_liter,
        total_cost=total_cost,
        date=data.date,
        notes=data.notes,
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


async def get_expenses(
    db: AsyncSession,
    vehicle_id: UUID | None = None,
    expense_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[Expense]:
    """Return expense entries, optionally filtered by vehicle, type, and date range."""
    query = select(Expense).order_by(Expense.date.desc(), Expense.created_at.desc())

    if vehicle_id is not None:
        query = query.where(Expense.vehicle_id == vehicle_id)
    if expense_type is not None:
        query = query.where(Expense.type == expense_type)
    if date_from is not None:
        query = query.where(Expense.date >= date_from)
    if date_to is not None:
        query = query.where(Expense.date <= date_to)

    result = await db.execute(query)
    return list(result.scalars().all())


async def create_expense(db: AsyncSession, data: ExpenseCreate) -> Expense:
    """Create a new expense entry."""
    expense = Expense(
        vehicle_id=data.vehicle_id,
        type=data.type,
        amount=data.amount,
        description=data.description,
        date=data.date,
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense
