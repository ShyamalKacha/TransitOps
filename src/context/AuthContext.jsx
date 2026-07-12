import { createContext, useContext, useState, useEffect } from 'react'

// ─── AuthContext ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// Role-based redirect map
export const ROLE_REDIRECT = {
  fleet_manager: '/dashboard',
  financial_analyst: '/reports',
  safety_officer: '/drivers',
  driver: '/trips',
}

// Role-based navigation permissions
export const ROLE_NAV = {
  fleet_manager: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'reports'],
  financial_analyst: ['reports', 'fuel'],
  safety_officer: ['drivers'],
  driver: ['trips'],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('transitops_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await api.post('/auth/login', { email, password })
      // const { user, token } = response.data
      // localStorage.setItem('transitops_token', token)

      // ── MOCK LOGIN (remove when backend is ready) ──
      await new Promise(r => setTimeout(r, 800)) // simulate network
      const mockUsers = {
        'manager@transitops.com': { id: 1, name: 'Rajesh Kumar', email: 'manager@transitops.com', role: 'fleet_manager', avatar: 'RK' },
        'analyst@transitops.com': { id: 2, name: 'Priya Sharma', email: 'analyst@transitops.com', role: 'financial_analyst', avatar: 'PS' },
        'safety@transitops.com': { id: 3, name: 'Amit Singh', email: 'safety@transitops.com', role: 'safety_officer', avatar: 'AS' },
        'driver@transitops.com': { id: 4, name: 'Ravi Verma', email: 'driver@transitops.com', role: 'driver', avatar: 'RV' },
      }
      const mockUser = mockUsers[email]
      if (!mockUser || password !== 'password') {
        throw new Error('Invalid email or password')
      }
      // ── END MOCK ──

      setUser(mockUser)
      localStorage.setItem('transitops_user', JSON.stringify(mockUser))
      return { success: true, role: mockUser.role }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('transitops_user')
    localStorage.removeItem('transitops_token')
  }

  const hasAccess = (page) => {
    if (!user) return false
    return ROLE_NAV[user.role]?.includes(page) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
