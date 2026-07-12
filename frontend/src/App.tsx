import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { DriversPage } from './pages/DriversPage';
import { TripsPage } from './pages/TripsPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { FuelExpensesPage } from './pages/FuelExpensesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FinancialAnalyticsPage } from './pages/FinancialAnalyticsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/my-trips" element={<MyTripsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics/financial" element={<FinancialAnalyticsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
