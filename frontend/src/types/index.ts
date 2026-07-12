// ---- Enums ----
export type UserRole =
  | 'admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'driver'
  | 'safety_officer'
  | 'financial_analyst';

export type VehicleStatus = 'available' | 'on_trip' | 'in_shop' | 'retired';
export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';
export type TripStatus = 'draft' | 'dispatched' | 'completed' | 'cancelled';
export type MaintenanceStatus = 'open' | 'closed';
export type ExpenseType = 'toll' | 'maintenance' | 'other';

// ---- Auth ----
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ---- Vehicles ----
export interface Vehicle {
  id: string;
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreate {
  registration_number: string;
  name: string;
  model?: string;
  vehicle_type?: string;
  max_load_capacity: number;
  odometer?: number;
  acquisition_cost?: number;
}

export interface VehicleUpdate {
  registration_number?: string;
  name?: string;
  model?: string;
  vehicle_type?: string;
  max_load_capacity?: number;
  odometer?: number;
  acquisition_cost?: number;
}

// ---- Drivers ----
export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface DriverCreate {
  name: string;
  license_number: string;
  license_category?: string;
  license_expiry_date: string;
  contact_number?: string;
}

export interface DriverUpdate {
  name?: string;
  license_number?: string;
  license_category?: string;
  license_expiry_date?: string;
  contact_number?: string;
}

// ---- Trips ----
export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number | null;
  planned_distance: number | null;
  actual_distance: number | null;
  status: TripStatus;
  dispatched_at: string | null;
  completed_at: string | null;
  final_odometer: number | null;
  fuel_consumed: number | null;
  revenue: number | null;
  driver_earnings: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripCreate {
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight?: number;
  planned_distance?: number;
  notes?: string;
}

export interface TripComplete {
  final_odometer: number;
  fuel_consumed: number;
  revenue: number;
  driver_earnings: number;
  actual_distance: number;
}

// ---- Maintenance ----
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  description: string;
  type: string;
  cost: number | null;
  status: MaintenanceStatus;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceCreate {
  vehicle_id: string;
  description: string;
  type?: string;
  cost?: number;
  scheduled_date?: string;
  notes?: string;
}

// ---- Fuel Logs ----
export interface FuelLog {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface FuelLogCreate {
  vehicle_id: string;
  driver_id?: string;
  liters: number;
  cost_per_liter: number;
  date: string;
  notes?: string;
}

// ---- Expenses ----
export interface Expense {
  id: string;
  vehicle_id: string;
  type: ExpenseType;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface ExpenseCreate {
  vehicle_id: string;
  type: ExpenseType;
  amount: number;
  description?: string;
  date: string;
}

// ---- Analytics ----
export interface Dashboard {
  vehicle_status_counts: Record<string, number>;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization: number;
}

export interface FuelEfficiencyItem {
  vehicle_name: string;
  registration_number: string;
  km_per_liter: number;
}

export interface CostBreakdown {
  fuel: number;
  maintenance: number;
  toll: number;
  total: number;
}

export interface VehicleROI {
  vehicle_name: string;
  registration_number: string;
  roi: number;
}

export interface ProfitPerTrip {
  trip_id: string;
  source: string;
  destination: string;
  revenue: number;
  total_cost: number;
  profit: number;
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
