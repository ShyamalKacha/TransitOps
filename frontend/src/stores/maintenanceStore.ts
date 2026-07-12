import { create } from 'zustand';
import api from '../api/client';
import type { MaintenanceRecord, MaintenanceCreate } from '../types';

interface MaintenanceState {
  records: MaintenanceRecord[];
  total: number;
  loading: boolean;
  fetchRecords: (params?: Record<string, unknown>) => Promise<void>;
  createRecord: (data: MaintenanceCreate) => Promise<void>;
  closeRecord: (id: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  records: [],
  total: 0,
  loading: false,
  fetchRecords: async (params) => {
    set({ loading: true });
    const { data } = await api.get('/maintenance', { params });
    set({ records: data.data ?? data, total: data.pagination?.total ?? data.length, loading: false });
  },
  createRecord: async (body) => {
    await api.post('/maintenance', body);
  },
  closeRecord: async (id) => {
    await api.patch(`/maintenance/${id}/close`);
  },
}));
