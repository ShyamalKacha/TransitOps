from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlparse

from app.config import settings
from app.database import async_session_factory, engine, Base
from app.modules.auth.models import User
from app.modules.auth.service import hash_password
from app.modules.auth.router import router as auth_router
from app.modules.vehicles.router import router as vehicles_router
from app.modules.drivers.router import router as drivers_router
from app.modules.trips.router import router as trips_router
from app.modules.maintenance.router import router as maintenance_router
from app.modules.fuel_expenses.router import fuel_logs_router, expenses_router
from app.modules.analytics.router import router as analytics_router


async def ensure_database():
    """Create the database if it doesn't exist."""
    parsed = urlparse(settings.DATABASE_URL)
    db_name = parsed.path.lstrip("/")
    # Build a connection string to the default 'postgres' database
    admin_dsn = (
        f"postgresql://{parsed.username}:{parsed.password}"
        f"@{parsed.hostname}:{parsed.port or 5432}/postgres"
    )
    conn = await asyncpg.connect(admin_dsn)
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", db_name
        )
        if not exists:
            await conn.execute(f'CREATE DATABASE "{db_name}"')
            print(f"Created database '{db_name}'")
    finally:
        await conn.close()


async def seed_admin():
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.role == "admin"))
        if not result.scalar_one_or_none():
            session.add(
                User(
                    email=settings.ADMIN_EMAIL,
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    name=settings.ADMIN_NAME,
                    role="admin",
                )
            )
            await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_database()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_admin()
    yield
    await engine.dispose()


app = FastAPI(title="TransitOps API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth_router, prefix="/api/admin", tags=["Admin"])
app.include_router(vehicles_router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(drivers_router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(trips_router, prefix="/api/trips", tags=["Trips"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(fuel_logs_router, prefix="/api/fuel-logs", tags=["Fuel & Expenses"])
app.include_router(expenses_router, prefix="/api/expenses", tags=["Fuel & Expenses"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
