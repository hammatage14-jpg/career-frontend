import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import styles from './Settings.module.css'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Settings</h2>
      <p className={styles.subtitle}>Manage your preferences and account.</p>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Appearance</h3>
        <div className={styles.row}>
          <span className={styles.label}>Theme</span>
          <div className={styles.themeOptions}>
            <button
              type="button"
              className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              Light
            </button>
            <button
              type="button"
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Notifications</h3>
        <p className={styles.hint}>Application updates and deadline reminders appear in the Notifications page. Email and push preferences can be added in a future update.</p>
        <div className={styles.row}>
          <span className={styles.label}>In-app notifications</span>
          <span className={styles.badge}>On</span>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Account</h3>
        <div className={styles.row}>
          <span className={styles.label}>Logged in as</span>
          <span className={styles.value}>{user?.email || user?.name || '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email verified</span>
          <span className={user?.emailVerified ? styles.badge : styles.value}>
            {user?.emailVerified ? 'Yes ✓' : 'No'}
          </span>
        </div>
        <p className={styles.hint}>
          {user?.emailVerified ? 'Your email is verified (e.g. via Google sign-in).' : 'Sign in with Google to verify your email, or use the verification link if you signed up with email.'}
        </p>
        <p className={styles.hint}>Update your name, email, and CV in <strong>My Profile</strong> from the sidebar.</p>
      </div>
    </div>
  )
}
