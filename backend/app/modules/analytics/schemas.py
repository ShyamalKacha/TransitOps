from pydantic import BaseModel


class DashboardResponse(BaseModel):
    vehicle_status_counts: dict[str, int]
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization: float


class FuelEfficiencyItem(BaseModel):
    vehicle_name: str
    registration_number: str
    km_per_liter: float


class FuelCostItem(BaseModel):
    vehicle_name: str
    registration_number: str
    avg_km_per_liter: float
    avg_cost_per_km: float


class CostBreakdown(BaseModel):
    fuel: float
    maintenance: float
    toll: float
    total: float


class VehicleROI(BaseModel):
    vehicle_name: str
    registration_number: str
    roi: float


class ProfitPerTrip(BaseModel):
    trip_id: str
    source: str
    destination: str
    revenue: float
    total_cost: float
    profit: float


class DriverTripItem(BaseModel):
    trip_id: str
    vehicle_name: str
    registration_number: str
    source: str
    destination: str
    status: str
    revenue: float
    earnings: float
