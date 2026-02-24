import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import styles from './Login.module.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!token) return
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess('Password updated. Redirecting to login…')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/login')}
          aria-label="Back"
        >
          ← Back
        </button>
        <div className={styles.logo}>IAS</div>
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.sub}>
          {token ? 'Enter your new password below.' : 'This link is invalid or has expired.'}
        </p>

        {token ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
            <label className={styles.label}>
              New password
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
            </label>
            <label className={styles.label}>
              Confirm password
              <input
                type="password"
                className={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </label>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        ) : (
          <p className={styles.toggle}>
            <button
              type="button"
              className={styles.toggleLink}
              onClick={() => navigate('/login')}
            >
              Back to log in
            </button>
            {' '}or use "Forgot password?" to request a new link.
          </p>
        )}
      </div>
    </div>
  )
}
