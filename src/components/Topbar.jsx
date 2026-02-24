import { useTheme } from '../context/ThemeContext'
import { IconMenu, IconSearch, IconBell, IconSun, IconMoon } from './Icons'
import styles from './Topbar.module.css'

export default function Topbar({ title, onMenuClick, onNotificationsClick }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.topbar}>
      <button className={styles.hamburger} onClick={onMenuClick} aria-label="Open menu">
        <IconMenu size={18} />
      </button>

      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <IconSearch size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search roles, companies…"
            aria-label="Search opportunities"
          />
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} onClick={onNotificationsClick} aria-label="Notifications">
          <IconBell size={18} />
          <span className={styles.notifDot} aria-hidden="true" />
        </button>

        {/* Theme toggle */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className={`${styles.themeIcon} ${theme === 'light' ? styles.visible : styles.hidden}`}>
            <IconSun size={17} />
          </span>
          <span className={`${styles.themeIcon} ${theme === 'dark' ? styles.visible : styles.hidden}`}>
            <IconMoon size={17} />
          </span>
        </button>
      </div>
    </header>
  )
}
