import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];

export function FinancialAnalyticsPage() {
  const {
    dashboard, fuelEfficiency, costBreakdown, vehicleROI, profitPerTrip,
    fetchDashboard, fetchFuelEfficiency, fetchOperationalCost, fetchVehicleROI, fetchProfitPerTrip,
  } = useAnalyticsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboard(),
      fetchFuelEfficiency(),
      fetchOperationalCost(),
      fetchVehicleROI(),
      fetchProfitPerTrip(),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p className="text-gray-500">Loading analytics...</p></div>;
  }

  const pieData = dashboard ? Object.entries(dashboard.vehicle_status_counts).map(([name, value]) => ({ name, value })) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Financial Analytics</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.open('/api/analytics/export/csv')}>Export CSV</Button>
          <Button variant="secondary" onClick={() => window.open('/api/analytics/export/pdf')}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Utilization Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Fleet Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel Efficiency Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Fuel Efficiency (km/L)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelEfficiency.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="registration_number" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="km_per_liter" fill="#3b82f6" name="km/L" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Operational Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Operational Cost Breakdown</h2>
          {costBreakdown && (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Fuel</span><span className="font-medium">{formatCurrency(costBreakdown.fuel)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Maintenance</span><span className="font-medium">{formatCurrency(costBreakdown.maintenance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Toll</span><span className="font-medium">{formatCurrency(costBreakdown.toll)}</span></div>
              <div className="border-t dark:border-gray-700 pt-2 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold">{formatCurrency(costBreakdown.total)}</span></div>
            </div>
          )}
        </div>

        {/* Vehicle ROI Horizontal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Vehicle ROI</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleROI.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="registration_number" type="category" width={100} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
              <Bar dataKey="roi" fill="#22c55e" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Per Trip */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700 mt-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Profit Per Trip</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitPerTrip.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" />
            <YAxis />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="profit" fill="#eab308" name="Profit" />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
