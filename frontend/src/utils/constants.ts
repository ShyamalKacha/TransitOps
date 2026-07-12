import type { UserRole, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'on_trip', label: 'On Trip', color: 'blue' },
  { value: 'in_shop', label: 'In Shop', color: 'yellow' },
  { value: 'retired', label: 'Retired', color: 'red' },
];

export const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'on_trip', label: 'On Trip', color: 'blue' },
  { value: 'off_duty', label: 'Off Duty', color: 'gray' },
  { value: 'suspended', label: 'Suspended', color: 'red' },
];

export const TRIP_STATUS_OPTIONS: { value: TripStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'dispatched', label: 'Dispatched', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

export const MAINTENANCE_STATUS_OPTIONS: { value: MaintenanceStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'yellow' },
  { value: 'closed', label: 'Closed', color: 'green' },
];
