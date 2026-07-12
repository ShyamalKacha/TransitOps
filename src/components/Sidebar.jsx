import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Users, MapPin,
  Wrench, Fuel, BarChart3, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ALL_NAV = [
  { key: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard' },
  { key: 'vehicles',    label: 'Vehicles',        icon: Truck,           path: '/vehicles' },
  { key: 'drivers',     label: 'Drivers',         icon: Users,           path: '/drivers' },
  { key: 'trips',       label: 'Trips',           icon: MapPin,          path: '/trips' },
  { key: 'maintenance', label: 'Maintenance',     icon: Wrench,          path: '/maintenance' },
  { key: 'fuel',        label: 'Fuel & Expenses', icon: Fuel,            path: '/fuel' },
  { key: 'reports',     label: 'Reports',         icon: BarChart3,       path: '/reports' },
]

export default function Sidebar() {
  const { user, logout, hasAccess } = useAuth()
  const navigate = useNavigate()

  const visible = ALL_NAV.filter((i) => hasAccess(i.key))

  return (
    <aside style={{
      width: '216px',
      minWidth: '216px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.2s, border-color 0.2s'
    }}>

      {/* Animated Logo — truck drives in, text reveals beside it */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'border-color 0.2s'
      }}>
        <div className="animate-logo-truck" style={{
          width: '28px', height: '28px',
          background: 'var(--accent)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 5v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <span className="animate-logo-text" style={{
          color: 'var(--text-primary)',
          fontWeight: '700',
          fontSize: '15px',
          letterSpacing: '-0.01em'
        }}>
          TransitOps
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {/* Section label */}
        <p style={{
          fontSize: '10px',
          fontWeight: '700',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '4px 10px 6px',
          margin: 0
        }}>
          Navigation
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visible.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* User + logout */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0, transition: 'border-color 0.2s' }}>
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', marginBottom: '4px',
          }}>
            <div style={{
              width: '26px', height: '26px',
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', color: '#fff',
              flexShrink: 0,
            }}>
              {user.avatar || user.name?.[0] || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        <button
          id="sidebar-logout"
          onClick={() => { logout(); navigate('/login', { replace: true }) }}
          className="nav-link"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          Logout
        </button>
      </div>
    </aside>
  )
}
