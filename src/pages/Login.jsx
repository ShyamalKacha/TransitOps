import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_REDIRECT } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Eye, EyeOff, AlertCircle, Loader2, Sun, Moon, Truck, Shield, BarChart3, Users, ArrowRight } from 'lucide-react'

const DEMO_ACCOUNTS = [
  {
    role: 'Fleet Manager',
    email: 'manager@transitops.com',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    icon: Truck,
    description: 'Full admin access to all dashboard operations'
  },
  {
    role: 'Financial Analyst',
    email: 'analyst@transitops.com',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    icon: BarChart3,
    description: 'Access reports, costs, and fuel logs'
  },
  {
    role: 'Safety Officer',
    email: 'safety@transitops.com',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    icon: Shield,
    description: 'Driver metrics, safety scorecards, and licenses'
  },
  {
    role: 'Driver',
    email: 'driver@transitops.com',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    icon: Users,
    description: 'View assigned active trips and safety logs'
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    try {
      const { role } = await login(email.trim(), password)
      navigate(ROLE_REDIRECT[role] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password')
    setError('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.2s, color 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Theme Toggle at Top Right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme === 'dark' ? '#fbbf24' : '#64748b',
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
        title="Toggle dark/light theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Decorative Background Shapes on Login (Flashy but clean) */}
      <div
        className="animate-float-orb"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '30%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: theme === 'dark' ? 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          alignItems: 'center',
          gap: '48px',
          zIndex: 10,
        }}
        className="lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1"
      >
        {/* ── LEFT PANEL: Flashy branding, live logo, details, roles ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-up">
          {/* Brand header — truck drives in, name reveals beside it */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Truck icon bounces in from the left */}
            <div className="animate-brand-truck" style={{
              width: '56px', height: '56px',
              background: 'var(--accent)', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Truck size={28} color="white" />
            </div>

            {/* Name + subtitle revealed sequentially */}
            <div>
              <div className="animate-brand-name" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <h1 style={{
                  fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: theme === 'dark' ? '#ffffff' : '#0f172a',
                  margin: 0
                }}>
                  TransitOps
                </h1>
              </div>
              <p className="animate-brand-subtitle" style={{
                fontSize: '11px', fontWeight: '600', color: 'var(--accent)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1px'
              }}>
                Fleet Logistics & Operations Platform
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '800',
              lineHeight: '1.2',
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Unifying fleet intelligence, drivers, and trips in <span style={{ color: 'var(--accent)' }}>real-time</span>.
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              maxWidth: '540px'
            }}>
              TransitOps acts as a centralized dashboard coordinating active dispatches, maintenance lifecycles, fuel expenditure analysis, and safety score analytics.
            </p>
          </div>

          {/* Demo Roles Container */}
          <div>
            <p style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}>
              Select a Demo Role to Login
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const IconComp = acc.icon
                return (
                  <button
                    key={acc.role}
                    onClick={() => fillDemo(acc.email)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = acc.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: acc.bg,
                          border: `1px solid ${acc.borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: acc.color
                        }}
                      >
                        <IconComp size={16} />
                      </div>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                      }}>
                        {acc.role}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      {acc.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Main Login Form (Classic, clean form card) ── */}
        <div style={{ display: 'flex', justifyContent: 'center' }} className="fade-up">
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '40px 32px',
              boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.25)' : '0 10px 30px rgba(0,0,0,0.04)',
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                Sign in
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Enter credentials or select a demo role.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="email"
                  style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="name@transitops.com"
                  className="input-field"
                  style={{ background: 'var(--bg-raised)' }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <label
                    htmlFor="password"
                    style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', flex: 1 }}
                  >
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className="input-field"
                    style={{ paddingRight: '40px', background: 'var(--bg-raised)' }}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px'
                  }}
                >
                  <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#ef4444' }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '4px'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
