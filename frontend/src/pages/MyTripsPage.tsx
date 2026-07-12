import { useEffect, useState } from 'react';
import api from '../api/client';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TRIP_STATUS_OPTIONS } from '../utils/constants';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { Trip } from '../types';

export function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get('/analytics/driver-trips');
        if (!cancelled) {
          setTrips(data.data ?? data);
        }
      } catch {
        // handled globally
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const columns: Column<Trip>[] = [
    { key: 'source', header: 'Source' },
    { key: 'destination', header: 'Destination' },
    {
      key: 'vehicle_id',
      header: 'Vehicle',
      render: (t) => (
        <span className="font-mono text-xs">{t.vehicle_id}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => {
        const opt = TRIP_STATUS_OPTIONS.find((o) => o.value === t.status);
        return <StatusBadge label={opt?.label ?? t.status} color={opt?.color} />;
      },
    },
    {
      key: 'dispatched_at',
      header: 'Time / Date',
      render: (t) => formatDateTime(t.dispatched_at ?? t.created_at),
    },
    {
      key: 'profit',
      header: 'Profit Earned',
      render: (t) => {
        const profit = (t.revenue ?? 0) - (t.driver_earnings ?? 0);
        return (
          <span className={profit >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
            {formatCurrency(profit)}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Trips</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your assigned trips and earnings overview.
        </p>
      </div>

      {/* Summary cards */}
      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Trips
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {trips.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Completed Trips
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {trips.filter((t) => t.status === 'completed').length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Earnings
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                trips.reduce((sum, t) => sum + ((t.revenue ?? 0) - (t.driver_earnings ?? 0)), 0)
              )}
            </p>
          </div>
        </div>
      )}

      {/* Trips table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={trips}
          loading={false}
          emptyMessage="No trips assigned to you yet."
        />
      </div>
    </div>
  );
}
