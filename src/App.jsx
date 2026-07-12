import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth, ROLE_REDIRECT } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import Fuel from './pages/Fuel'
import Reports from './pages/Reports'

import { ThemeProvider } from './context/ThemeContext'

// Guard: if logged in, redirect away from /login to the role-based home
function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) {
    const redirect = ROLE_REDIRECT[user.role] || '/dashboard'
    return <Navigate to={redirect} replace />
  }
  return children
}

// Guard: protect a route, require one of the allowed page keys
function PrivateRoute({ children, pageKey }) {
  const { user, hasAccess } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (pageKey && !hasAccess(pageKey)) {
    // Redirect to the role's home page if access denied
    const home = ROLE_REDIRECT[user.role] || '/dashboard'
    return <Navigate to={home} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected — all behind DashboardLayout */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <PrivateRoute pageKey="dashboard">
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <PrivateRoute pageKey="vehicles">
              <Vehicles />
            </PrivateRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <PrivateRoute pageKey="drivers">
              <Drivers />
            </PrivateRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <PrivateRoute pageKey="trips">
              <Trips />
            </PrivateRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <PrivateRoute pageKey="maintenance">
              <Maintenance />
            </PrivateRoute>
          }
        />
        <Route
          path="/fuel"
          element={
            <PrivateRoute pageKey="fuel">
              <Fuel />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute pageKey="reports">
              <Reports />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

