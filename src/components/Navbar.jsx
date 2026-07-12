import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

const PAGE_LABELS = {
  '/dashboard':   'Dashboard',
  '/vehicles':    'Vehicles',
  '/drivers':     'Drivers',
  '/trips':       'Trips',
  '/maintenance': 'Maintenance',
  '/fuel':        'Fuel & Expenses',
  '/reports':     'Reports',
}

export default function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
      transition: 'background-color 0.2s, border-color 0.2s'
    }}>
      <h1 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
        {PAGE_LABELS[pathname] || 'TransitOps'}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '6px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-raised)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {user.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>
                {user.role?.replace('_', ' ')}
              </p>
            </div>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '600', color: '#fff',
            }}>
              {user.avatar || user.name?.[0] || 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
