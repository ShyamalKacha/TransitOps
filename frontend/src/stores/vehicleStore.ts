import { create } from 'zustand';
import api from '../api/client';
import type { Vehicle, VehicleCreate, VehicleUpdate } from '../types';

interface VehicleState {
  vehicles: Vehicle[];
  total: number;
  loading: boolean;
  fetchVehicles: (params?: Record<string, unknown>) => Promise<void>;
  createVehicle: (data: VehicleCreate) => Promise<void>;
  updateVehicle: (id: string, data: VehicleUpdate) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  total: 0,
  loading: false,
  fetchVehicles: async (params) => {
    set({ loading: true });
    const { data } = await api.get('/vehicles', { params });
    set({ vehicles: data.data ?? data, total: data.pagination?.total ?? data.length, loading: false });
  },
  createVehicle: async (body) => {
    await api.post('/vehicles', body);
  },
  updateVehicle: async (id, body) => {
    await api.put(`/vehicles/${id}`, body);
  },
  deleteVehicle: async (id) => {
    await api.delete(`/vehicles/${id}`);
  },
  changeStatus: async (id, status) => {
    await api.patch(`/vehicles/${id}/status`, { status });
  },
}));
