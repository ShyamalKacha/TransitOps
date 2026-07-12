import { create } from 'zustand';
import api from '../api/client';
import type { Driver, DriverCreate, DriverUpdate } from '../types';

interface DriverState {
  drivers: Driver[];
  total: number;
  loading: boolean;
  fetchDrivers: (params?: Record<string, unknown>) => Promise<void>;
  createDriver: (data: DriverCreate) => Promise<void>;
  updateDriver: (id: string, data: DriverUpdate) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string) => Promise<void>;
  updateSafetyScore: (id: string, score: number) => Promise<void>;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: [],
  total: 0,
  loading: false,
  fetchDrivers: async (params) => {
    set({ loading: true });
    const { data } = await api.get('/drivers', { params });
    set({ drivers: data.data ?? data, total: data.pagination?.total ?? data.length, loading: false });
  },
  createDriver: async (body) => {
    await api.post('/drivers', body);
  },
  updateDriver: async (id, body) => {
    await api.put(`/drivers/${id}`, body);
  },
  deleteDriver: async (id) => {
    await api.delete(`/drivers/${id}`);
  },
  changeStatus: async (id, status) => {
    await api.patch(`/drivers/${id}/status`, { status });
  },
  updateSafetyScore: async (id, safety_score) => {
    await api.patch(`/drivers/${id}/safety-score`, { safety_score });
  },
}));
