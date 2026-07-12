import { useEffect } from 'react';
import { Truck, Route, Clock, Users, Gauge } from 'lucide-react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useAuthStore } from '../stores/authStore';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { VEHICLE_STATUS_OPTIONS } from '../utils/constants';

const STATUS_COLORS: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  red: 'text-red-600 dark:text-red-400',
  gray: 'text-gray-600 dark:text-gray-400',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const { dashboard, loading, fetchDashboard } = useAnalyticsStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Role check — only admin and fleet_manager
  if (!user || !['admin', 'fleet_manager'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const totalVehicles = Object.values(dashboard.vehicle_status_counts).reduce(
    (sum, count) => sum + count,
    0
  );

  const kpiCards = [
    { title: 'Total Vehicles', value: totalVehicles, icon: Truck },
    { title: 'Active Trips', value: dashboard.active_trips, icon: Route },
    { title: 'Pending Trips', value: dashboard.pending_trips, icon: Clock },
    { title: 'Drivers on Duty', value: dashboard.drivers_on_duty, icon: Users },
    { title: 'Fleet Utilization', value: `${dashboard.fleet_utilization}%`, icon: Gauge },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={<card.icon className="w-5 h-5" />}
          />
        ))}
      </div>

      {/* Vehicle Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Vehicle Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {VEHICLE_STATUS_OPTIONS.map((status) => {
            const count = dashboard.vehicle_status_counts[status.value] ?? 0;
            return (
              <div
                key={status.value}
                className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <p className={`text-3xl font-bold ${STATUS_COLORS[status.color] || STATUS_COLORS.gray}`}>
                  {count}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {status.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
