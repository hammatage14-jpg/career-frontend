import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar   from './components/Sidebar'
import Topbar    from './components/Topbar'
import Landing   from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Login     from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Browse    from './pages/Browse'
import Applications from './pages/Applications'
import Saved     from './pages/Saved'
import Profile   from './pages/Profile'
import Messages  from './pages/Messages'
import Notifications from './pages/Notifications'
import CVBuilder from './pages/CVBuilder'
import CareerGuidance from './pages/CareerGuidance'
import Settings  from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import { authService } from './services/api'

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  browse:       'Browse Opportunities',
  applications: 'My Applications',
  saved:        'Saved Roles',
  profile:      'My Profile',
  messages:     'Messages',
  notifications:'Notifications',
  cv:           'CV Builder',
  guidance:     'Career Guidance',
  settings:     'Settings',
  admin:        'Admin Dashboard',
}

const APP_PAGES = ['dashboard', 'browse', 'applications', 'saved', 'profile', 'messages', 'notifications', 'cv', 'guidance', 'settings', 'admin']

function activeNavFromPath(pathname) {
  const base = '/app'
  if (!pathname.startsWith(base)) return 'dashboard'
  const rest = pathname.slice(base.length).replace(/^\/+/, '') || 'dashboard'
  return APP_PAGES.includes(rest) ? rest : 'dashboard'
}

function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeNav = activeNavFromPath(pathname)
  const setActiveNav = (id) => navigate(`/app/${id}`)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [verifiedMessage, setVerifiedMessage] = useState(null)
  const [resendStatus, setResendStatus] = useState('')
  const { user: authUser, logout, refreshUser } = useAuth()

  const handleResendVerification = async () => {
    if (resendStatus === 'sending') return
    setResendStatus('sending')
    try {
      const res = await authService.resendVerification()
      setResendStatus(res.data?.message?.includes('sent') ? 'sent' : 'sent')
      setTimeout(() => setResendStatus(''), 5000)
    } catch {
      setResendStatus('error')
      setTimeout(() => setResendStatus(''), 5000)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')
    if (verified === '1') {
      refreshUser?.()
      window.history.replaceState({}, '', window.location.pathname)
      setVerifiedMessage('Email verified successfully.')
      const t = setTimeout(() => setVerifiedMessage(null), 5000)
      return () => clearTimeout(t)
    }
    if (verified === 'error') {
      window.history.replaceState({}, '', window.location.pathname)
      setVerifiedMessage('Verification link invalid or expired.')
      const t = setTimeout(() => setVerifiedMessage(null), 6000)
      return () => clearTimeout(t)
    }
  }, [refreshUser])

  const user = authUser ? {
    name: authUser.name || 'User',
    role: authUser.role === 'admin' ? 'Admin' : authUser.role === 'graduate' ? 'Graduate' : 'Student',
    initials: (authUser.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
  } : { name: 'Guest', role: 'Student', initials: 'GU' }
  const isAdmin = authUser?.role === 'admin'

  const renderPage = () => {
    switch (activeNav) {
      case 'dashboard':    return <Dashboard setActiveNav={setActiveNav} />
      case 'browse':       return <Browse />
      case 'applications': return <Applications />
      case 'saved':        return <Saved />
      case 'profile':      return <Profile />
      case 'messages':     return <Messages />
      case 'admin':        return isAdmin ? <AdminDashboard /> : <Dashboard setActiveNav={setActiveNav} />
      case 'notifications': return <Notifications />
      case 'cv':           return <CVBuilder />
      case 'guidance':     return <CareerGuidance />
      case 'settings':     return <Settings />
      default:             return <Dashboard setActiveNav={setActiveNav} />
    }
  }

  return (
    <div className="shell">
      {verifiedMessage && (
        <div style={{ background: verifiedMessage.includes('success') ? 'var(--green-bg)' : 'var(--amber-bg)', color: verifiedMessage.includes('success') ? 'var(--green)' : 'var(--amber)', padding: '10px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
          {verifiedMessage}
        </div>
      )}
      {authUser && !authUser.emailVerified && !verifiedMessage && (
        <div style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '10px 24px', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          Please check your email to verify your account.
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendStatus === 'sending'}
            style={{ background: 'transparent', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: resendStatus === 'sending' ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? 'Email sent!' : resendStatus === 'error' ? 'Try again' : 'Resend verification email'}
          </button>
        </div>
      )}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
        isAdmin={isAdmin}
      />
      <div className="main">
        <Topbar
          title={PAGE_TITLES[activeNav]}
          onMenuClick={() => setSidebarOpen(o => !o)}
          onNotificationsClick={() => setActiveNav('notifications')}
        />
        {renderPage()}
      </div>
    </div>
  )
}

function LandingRoute() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)' }}>
        Loading…
      </div>
    )
  }
  if (user) return <Navigate to="/app" replace />
  return (
    <Landing
      onSignIn={() => navigate('/login')}
      onGetStarted={() => navigate('/signup')}
    />
  )
}

function LoginRoute({ mode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)' }}>
        Loading…
      </div>
    )
  }
  if (user) return <Navigate to="/app" />
  return (
    <Login
      mode={mode}
      onBack={() => navigate('/')}
    />
  )
}

function ResetPasswordRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)' }}>
        Loading…
      </div>
    )
  }
  if (user) return <Navigate to="/app" />
  return <ResetPassword />
}

function AppRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)' }}>
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return <AppShell />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingRoute />} />
            <Route path="/login" element={<LoginRoute mode="login" />} />
            <Route path="/signup" element={<LoginRoute mode="register" />} />
            <Route path="/reset-password" element={<ResetPasswordRoute />} />
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/:page" element={<AppRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
