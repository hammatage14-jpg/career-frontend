import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/api'
import styles from './Login.module.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Login({ onBack, mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'register' | 'forgot' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [otp, setOtp] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const googleButtonRef = useRef(null)
  const modeRoleRef = useRef({ mode: initialMode, role: 'student' })
  const { login, register, verifyEmail, loginWithGoogle } = useAuth()

  modeRoleRef.current = { mode, role }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    const initGoogle = () => {
      if (cancelled || !window.google?.accounts?.id) return false
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            setError('')
            setLoading(true)
            const { role: r } = modeRoleRef.current
            loginWithGoogle(res.credential, r)
              .catch(err => {
                const msg = err.response?.data?.message || err.message || 'Google sign-in failed.'
                setError(msg)
              })
              .finally(() => setLoading(false))
          },
        })
        if (googleButtonRef.current && !googleButtonRef.current.querySelector('iframe')) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 280,
          })
        }
        return true
      } catch (e) {
        return false
      }
    }
    const tryInit = () => {
      if (cancelled) return
      if (initGoogle()) return
      setTimeout(tryInit, 150)
    }
    tryInit()
    return () => { cancelled = true }
  }, [loginWithGoogle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setVerificationMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email, password })
      } else if (mode === 'forgot') {
        const res = await authService.forgotPassword(email)
        setVerificationMessage(res.data?.message || 'If an account exists, a reset link has been sent.')
        if (res.data?.smtpError) setError(`SMTP error: ${res.data.smtpError}`)
        else setMode('login')
      } else if (mode === 'verify') {
        await verifyEmail(pendingEmail, otp)
      } else {
        const data = await register({ name, email, password, role })
        if (data?.token) return
        setPendingEmail(email)
        setMode('verify')
        setVerificationMessage(data?.message || 'OTP sent. Please check your email.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Something went wrong'
      setError(msg)
      if (mode === 'register' && (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('email already'))) {
        setMode('login')
        setError('This email is already registered. Log in instead.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await authService.resendVerification(pendingEmail)
      setVerificationMessage(res.data?.message || 'OTP resent.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Back">
            ← Back
          </button>
        )}
        <div className={styles.logo}>IAS</div>
        <h1 className={styles.title}>
          {mode === 'login' ? 'Log in' : mode === 'forgot' ? 'Forgot password' : mode === 'verify' ? 'Verify email' : 'Sign up'}
        </h1>
        {mode === 'register' && (
          <p className={styles.sub}>Create an account to browse and apply for opportunities.</p>
        )}
        {mode === 'forgot' && (
          <p className={styles.sub}>Enter your email and we’ll send you a link to reset your password.</p>
        )}
        {mode === 'verify' && (
          <p className={styles.sub}>Enter the 6-digit code we sent to {pendingEmail}</p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {verificationMessage && (
            <div className={styles.success} role="alert">
              {verificationMessage}
            </div>
          )}
          {mode === 'verify' && (
            <>
              <label className={styles.label}>
                6-digit code
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className={styles.input}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </label>
              <button type="button" className={styles.toggleLink} onClick={handleResendOTP} disabled={loading} style={{ fontSize: 14, marginTop: -8 }}>
                Resend OTP
              </button>
            </>
          )}
          {mode === 'register' && (
            <label className={styles.label}>
              Name
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}
          {mode === 'register' && (
            <label className={styles.label}>
              I am a
              <select
                className={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Account type"
              >
                <option value="student">Student</option>
                <option value="graduate">Graduate</option>
              </select>
            </label>
          )}
          {mode !== 'verify' && (
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          )}
          {(mode === 'login' || mode === 'register') && (
            <label className={styles.label}>
              Password
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? '••••••••' : 'At least 6 characters'}
                minLength={mode === 'register' ? 6 : undefined}
              />
            </label>
          )}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <button
                type="button"
                className={styles.toggleLink}
                onClick={() => { setMode('forgot'); setError(''); setVerificationMessage(''); }}
                style={{ textDecoration: 'underline', fontSize: 14 }}
              >
                Forgot password?
              </button>
            </div>
          )}
          <button type="submit" className={styles.submitBtn} disabled={loading || (mode === 'verify' && otp.length !== 6)}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'forgot' ? 'Send reset link' : mode === 'verify' ? 'Verify' : 'Sign up'}
          </button>

          {GOOGLE_CLIENT_ID && (mode === 'login' || mode === 'register') && mode !== 'verify' && (
            <>
              <div className={styles.divider}>or</div>
              <div ref={googleButtonRef} className={styles.googleBtnWrap} />
            </>
          )}
        </form>

        <p className={styles.toggle}>
          {mode === 'login' && "Don't have an account? "}
          {mode === 'login' && (
            <button type="button" className={styles.toggleLink} onClick={() => { setMode('register'); setError(''); setVerificationMessage(''); }}>
              Sign up
            </button>
          )}
          {(mode === 'register' || mode === 'verify') && 'Already have an account? '}
          {(mode === 'register' || mode === 'verify') && (
            <button type="button" className={styles.toggleLink} onClick={() => { setMode('login'); setError(''); setVerificationMessage(''); setOtp(''); setPendingEmail(''); }}>
              Log in
            </button>
          )}
          {mode === 'forgot' && 'Remember your password? '}
          {mode === 'forgot' && (
            <button type="button" className={styles.toggleLink} onClick={() => { setMode('login'); setError(''); setVerificationMessage(''); }}>
              Log in
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
