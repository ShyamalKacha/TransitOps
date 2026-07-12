import { create } from 'zustand';
import api from '../api/client';
import type { FuelLog, FuelLogCreate, Expense, ExpenseCreate } from '../types';

interface FuelExpenseState {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  fuelLoading: boolean;
  expenseLoading: boolean;
  fetchFuelLogs: (params?: Record<string, unknown>) => Promise<void>;
  createFuelLog: (data: FuelLogCreate) => Promise<void>;
  fetchExpenses: (params?: Record<string, unknown>) => Promise<void>;
  createExpense: (data: ExpenseCreate) => Promise<void>;
}

export const useFuelExpenseStore = create<FuelExpenseState>((set) => ({
  fuelLogs: [],
  expenses: [],
  fuelLoading: false,
  expenseLoading: false,
  fetchFuelLogs: async (params) => {
    set({ fuelLoading: true });
    const { data } = await api.get('/fuel-logs', { params });
    set({ fuelLogs: data.data ?? data, fuelLoading: false });
  },
  createFuelLog: async (body) => {
    await api.post('/fuel-logs', body);
  },
  fetchExpenses: async (params) => {
    set({ expenseLoading: true });
    const { data } = await api.get('/expenses', { params });
    set({ expenses: data.data ?? data, expenseLoading: false });
  },
  createExpense: async (body) => {
    await api.post('/expenses', body);
  },
}));
