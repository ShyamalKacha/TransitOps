import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    DISPATCHER = "dispatcher"
    DRIVER = "driver"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    IN_SHOP = "in_shop"
    RETIRED = "retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "draft"
    DISPATCHED = "dispatched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class ExpenseType(str, enum.Enum):
    TOLL = "toll"
    MAINTENANCE = "maintenance"
    OTHER = "other"
