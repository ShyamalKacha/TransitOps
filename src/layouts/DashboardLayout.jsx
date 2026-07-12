import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function DashboardLayout() {
  const { user } = useAuth()

  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', transition: 'background-color 0.2s' }}>
      {/* Fixed-height Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Sticky top navbar */}
        <Navbar />

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-base)', transition: 'background-color 0.2s' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
