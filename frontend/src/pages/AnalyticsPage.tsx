import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { KpiCard } from '../components/ui/KpiCard';
import { Button } from '../components/ui/Button';
import { BarChart3, Truck, Route, Users } from 'lucide-react';

export function AnalyticsPage() {
  const { dashboard, fetchDashboard } = useAnalyticsStore();

  useEffect(() => { fetchDashboard(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">Analytics Dashboard</h1>

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Total Vehicles" value={Object.values(dashboard.vehicle_status_counts).reduce((a, b) => a + b, 0)} icon={<Truck size={20} />} />
          <KpiCard title="Active Trips" value={dashboard.active_trips} icon={<Route size={20} />} />
          <KpiCard title="Pending Trips" value={dashboard.pending_trips} icon={<Route size={20} />} />
          <KpiCard title="Drivers on Duty" value={dashboard.drivers_on_duty} icon={<Users size={20} />} />
          <KpiCard title="Fleet Utilization" value={`${dashboard.fleet_utilization.toFixed(1)}%`} icon={<BarChart3 size={20} />} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Financial Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Detailed financial analysis including fuel efficiency, operational costs, vehicle ROI, and profit per trip.</p>
        <Link to="/analytics/financial">
          <Button>View Financial Analytics</Button>
        </Link>
      </div>
    </div>
  );
}
