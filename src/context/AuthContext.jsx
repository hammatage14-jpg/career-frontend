import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — try to restore session from backend (skip request if no token to avoid 401 redirect loop)
  useEffect(() => {
    const token = localStorage.getItem('ias_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    authService.me()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const refreshUser = async () => {
    const token = localStorage.getItem('ias_token')
    if (!token) return
    try {
      const res = await authService.me()
      setUser(res.data)
    } catch {
      setUser(null)
    }
  }

  const login = async (credentials) => {
    const res = await authService.login(credentials)
    if (res.data.token) localStorage.setItem('ias_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (data) => {
    const res = await authService.register(data)
    // OTP flow: no token until verify-email succeeds
    if (res.data.token) {
      localStorage.setItem('ias_token', res.data.token)
      setUser(res.data.user)
    }
    return res.data
  }

  const verifyEmail = async (email, otp) => {
    const res = await authService.verifyEmail(email, otp)
    if (res.data.token) {
      localStorage.setItem('ias_token', res.data.token)
      setUser(res.data.user)
    }
    return res.data
  }

  const loginWithGoogle = async (idToken, role) => {
    const res = await authService.loginGoogle(idToken, role)
    if (res.data.token) localStorage.setItem('ias_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    await authService.logout().catch(() => {})
    localStorage.removeItem('ias_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
