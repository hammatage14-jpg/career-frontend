import { useState } from 'react'
import {
  IconGrid, IconSearch, IconFile, IconHeart,
  IconUser, IconMessage, IconBell, IconBook,
  IconStar, IconSettings, IconDots, IconShield,
} from './Icons'
import styles from './Sidebar.module.css'

const NAV_ICONS = {
  dashboard:    <IconGrid size={17} />,
  browse:       <IconSearch size={17} />,
  applications: <IconFile size={17} />,
  saved:        <IconHeart size={17} />,
  profile:      <IconUser size={17} />,
  messages:     <IconMessage size={17} />,
  notifications:<IconBell size={17} />,
  cv:           <IconBook size={17} />,
  guidance:     <IconStar size={17} />,
  settings:     <IconSettings size={17} />,
  admin:        <IconShield size={17} />,
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.active : ''}`}
      onClick={() => onClick(item.id)}
    >
      <span className={styles.navIcon}>{NAV_ICONS[item.id]}</span>
      <span className={styles.navLabel}>{item.label}</span>
      {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
    </button>
  )
}

export default function Sidebar({ activeNav, setActiveNav, isOpen, onClose, user, onLogout, isAdmin }) {
  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>IAS</div>
            <span className={styles.logoName}>IAS Platform</span>
          </div>
          <p className={styles.logoTagline}>Internships &amp; Industrial Attachments</p>
        </div>

        <nav className={styles.nav}>
          <p className={styles.sectionLabel}>Overview</p>
          {[
            { id: 'dashboard',    label: 'Dashboard',            badge: null },
            { id: 'browse',       label: 'Browse Opportunities', badge: null },
            { id: 'applications', label: 'My Applications',      badge: null },
            { id: 'saved',        label: 'Saved',                badge: null },
          ].map(item => (
            <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={(id) => { setActiveNav(id); onClose(); }} />
          ))}

          <p className={styles.sectionLabel}>Manage</p>
          {[
            { id: 'profile',       label: 'My Profile',    badge: null },
            { id: 'messages',      label: 'Messages',      badge: null },
            { id: 'notifications', label: 'Notifications', badge: null },
          ].map(item => (
            <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={(id) => { setActiveNav(id); onClose(); }} />
          ))}

          {isAdmin && (
            <>
              <p className={styles.sectionLabel}>Admin</p>
              {[{ id: 'admin', label: 'Admin Dashboard', badge: null }].map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={(id) => { setActiveNav(id); onClose(); }} />
              ))}
            </>
          )}
          <p className={styles.sectionLabel}>Resources</p>
          {[
            { id: 'cv',       label: 'CV Builder',      badge: null },
            { id: 'guidance', label: 'Career Guidance',  badge: null },
            { id: 'settings', label: 'Settings',         badge: null },
          ].map(item => (
            <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={(id) => { setActiveNav(id); onClose(); }} />
          ))}
        </nav>

        {/* User chip + Sign out */}
        <div className={styles.footer}>
          <div className={styles.userChip}>
            <div className={styles.avatar}>
              {user ? user.initials : 'AK'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user ? user.name : 'Amara Kamara'}</div>
              <div className={styles.userRole}>{user ? user.role : 'Student'}</div>
            </div>
            <IconDots size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          </div>
          {onLogout && (
            <button type="button" className={styles.logoutBtn} onClick={onLogout}>Sign out</button>
          )}
        </div>
      </aside>
    </>
  )
}
