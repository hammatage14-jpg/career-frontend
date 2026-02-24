import { useState, useEffect } from 'react'
import { dashboardService } from '../services/api'
import styles from './Notifications.module.css'

function formatActivityTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ActivityItem({ item }) {
  return (
    <div className={styles.item}>
      <div className={`${styles.dot} ${styles[`dot_${item.type}`]}`} />
      <div className={styles.content}>
        <div className={styles.text}>
          <strong>{item.statusPhrase}</strong> — {item.title} at {item.company}
        </div>
        <div className={styles.time}>{item.time}</div>
      </div>
    </div>
  )
}

export default function Notifications() {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getActivity(50)
      .then(res => res.data)
      .then(data => {
        setActivity(Array.isArray(data) ? data.map(a => {
          const opp = a.opportunity || {}
          const statusPhrase = a.status === 'accepted' ? 'Accepted' : a.status === 'rejected' ? 'Not selected' : a.status === 'pending_payment' ? 'Pending payment' : 'Application submitted'
          return {
            id: a._id || a.id,
            type: a.status === 'accepted' ? 'green' : a.status === 'rejected' ? 'amber' : a.status === 'pending_payment' ? 'orange' : 'blue',
            statusPhrase,
            title: opp.title || 'Role',
            company: opp.company || 'Company',
            time: formatActivityTime(a.createdAt),
          }
        }) : [])
      })
      .catch(() => setActivity([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Notifications</h2>
      <p className={styles.subtitle}>Application updates, deadline reminders, and recruiter activity.</p>
      <div className={styles.card}>
        <div className={styles.list}>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : activity.length > 0 ? (
            activity.map(item => <ActivityItem key={item.id} item={item} />)
          ) : (
            <p className={styles.empty}>No notifications yet. Your application updates will appear here.</p>
          )}
        </div>
      </div>
    </div>
  )
}
