import { create } from 'zustand';
import api from '../api/client';
import type { Trip, TripCreate, TripComplete } from '../types';

interface TripState {
  trips: Trip[];
  total: number;
  loading: boolean;
  fetchTrips: (params?: Record<string, unknown>) => Promise<void>;
  createTrip: (data: TripCreate) => Promise<void>;
  updateTrip: (id: string, data: Partial<TripCreate>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  dispatchTrip: (id: string) => Promise<void>;
  completeTrip: (id: string, data: TripComplete) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  total: 0,
  loading: false,
  fetchTrips: async (params) => {
    set({ loading: true });
    const { data } = await api.get('/trips', { params });
    set({ trips: data.data ?? data, total: data.pagination?.total ?? data.length, loading: false });
  },
  createTrip: async (body) => {
    await api.post('/trips', body);
  },
  updateTrip: async (id, body) => {
    await api.put(`/trips/${id}`, body);
  },
  deleteTrip: async (id) => {
    await api.delete(`/trips/${id}`);
  },
  dispatchTrip: async (id) => {
    await api.patch(`/trips/${id}/dispatch`);
  },
  completeTrip: async (id, body) => {
    await api.patch(`/trips/${id}/complete`, body);
  },
  cancelTrip: async (id) => {
    await api.patch(`/trips/${id}/cancel`);
  },
}));
