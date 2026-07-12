import { create } from 'zustand';
import api from '../api/client';
import type {
  Dashboard,
  FuelEfficiencyItem,
  CostBreakdown,
  VehicleROI,
  ProfitPerTrip,
} from '../types';

interface AnalyticsState {
  dashboard: Dashboard | null;
  fuelEfficiency: FuelEfficiencyItem[];
  costBreakdown: CostBreakdown | null;
  vehicleROI: VehicleROI[];
  profitPerTrip: ProfitPerTrip[];
  loading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchFuelEfficiency: () => Promise<void>;
  fetchOperationalCost: () => Promise<void>;
  fetchVehicleROI: () => Promise<void>;
  fetchProfitPerTrip: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  dashboard: null,
  fuelEfficiency: [],
  costBreakdown: null,
  vehicleROI: [],
  profitPerTrip: [],
  loading: false,
  fetchDashboard: async () => {
    const { data } = await api.get('/analytics/dashboard');
    set({ dashboard: data.data ?? data });
  },
  fetchFuelEfficiency: async () => {
    const { data } = await api.get('/analytics/fuel-efficiency');
    set({ fuelEfficiency: data.data ?? data });
  },
  fetchOperationalCost: async () => {
    const { data } = await api.get('/analytics/operational-cost');
    set({ costBreakdown: data.data ?? data });
  },
  fetchVehicleROI: async () => {
    const { data } = await api.get('/analytics/vehicle-roi');
    set({ vehicleROI: data.data ?? data });
  },
  fetchProfitPerTrip: async () => {
    const { data } = await api.get('/analytics/profit-per-trip');
    set({ profitPerTrip: data.data ?? data });
  },
}));
