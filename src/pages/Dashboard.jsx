import { useState, useEffect } from 'react'
import { useCounter } from '../hooks/useCounter'
import { IconFile, IconCheck, IconEye, IconHeart, IconBookmark, IconPlus, IconChevronRight, IconFilter } from '../components/Icons'
import { dashboardService, applicationService, opportunityService } from '../services/api'
import { FILTER_TABS } from '../data/mockData'
import ApplyForm from '../components/ApplyForm'
import OpportunityDetailModal from '../components/OpportunityDetailModal'

/* ─── Helpers ─────────────────────────────────────────────────── */
const BACKEND_STATUS_TO_UI = {
  pending_payment: 'pending_payment',
  submitted: 'submitted',
  under_review: 'review',
  shortlisted: 'review',
  accepted: 'accepted',
  rejected: 'rejected',
}
const STATUS_MAP = {
  pending_payment: { label: 'Pending payment', cls: 'pillPending' },
  submitted:       { label: 'Submitted',       cls: 'pillReview' },
  review:          { label: 'In Review',       cls: 'pillReview' },
  accepted:        { label: 'Accepted',        cls: 'pillAccepted' },
  rejected:        { label: 'Not Selected',    cls: 'pillRejected' },
}

const STAT_ICONS = {
  orange: <IconFile  size={19} />,
  green:  <IconCheck size={19} />,
  blue:   <IconEye   size={19} />,
  amber:  <IconHeart size={19} />,
}

const LOGO_COLORS = [
  { bg: '#FFF3E0', color: '#E65100' },
  { bg: '#E3F2FD', color: '#0D47A1' },
  { bg: '#E8F5E9', color: '#1B5E20' },
  { bg: '#F3E5F5', color: '#4A148C' },
  { bg: '#FFF8E1', color: '#F57F17' },
]

function getInitials(str) {
  if (!str || typeof str !== 'string') return '—'
  const words = str.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2)
  return str.slice(0, 2).toUpperCase()
}

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatActivityTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDate(d)
}

function getLogoColors(index) {
  return LOGO_COLORS[index % LOGO_COLORS.length]
}

/* ─── StatCard ────────────────────────────────────────────────── */
function StatCard({ stat, delay }) {
  const count = useCounter(Number(stat.value) || 0)
  return (
    <div className={`stat-card animate-fade-up`} style={{ animationDelay: `${delay}s` }}>
      <div className={`stat-icon icon-${stat.color}`}>{STAT_ICONS[stat.color]}</div>
      <div className="stat-value">{count}</div>
      <div className="stat-label">{stat.label}</div>
      {stat.delta != null && stat.delta !== '' && (
        <span className={`stat-delta delta-${stat.deltaType || 'up'}`}>{stat.delta}</span>
      )}
    </div>
  )
}

/* ─── OpportunityItem ─────────────────────────────────────────── */
function OpportunityItem({ opp, onApply, onShowDetails }) {
  return (
    <div className="opp-item">
      <div className="company-logo" style={{ background: opp.logoBg, color: opp.logoColor, borderColor: opp.logoBg }}>
        {opp.logoInitials}
      </div>
      <div className="opp-content">
        <div className="opp-title">{opp.title}</div>
        <div className="opp-company">{opp.company} · {opp.location || '—'}</div>
        <div className="opp-tags">
          <span className="tag tag-type">{opp.typeDisplay || opp.type}</span>
          {opp.category && <span className="tag tag-field">{opp.category}</span>}
        </div>
        {onShowDetails && (
          <button type="button" className="opp-see-more" onClick={() => onShowDetails(opp)}>
            See more details
          </button>
        )}
      </div>
      <div className="opp-meta">
        <div className="opp-date">Closes {opp.closingDate}</div>
        {onApply && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onApply(opp)}>
            Apply
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── ActivityItem ────────────────────────────────────────────── */
function ActivityItem({ item }) {
  return (
    <div className="activity-item">
      <div className={`activity-dot dot-${item.type}`} />
      <div>
        <div className="activity-text">
          <strong>{item.statusPhrase}</strong> — {item.title} at {item.company}
        </div>
        <div className="activity-time">{item.time}</div>
      </div>
    </div>
  )
}

/* ─── ApplicationRow ──────────────────────────────────────────── */
function ApplicationRow({ app, onView }) {
  const statusKey = BACKEND_STATUS_TO_UI[app.status] || 'pending_payment'
  const status = STATUS_MAP[statusKey]
  return (
    <tr>
      <td>
        <div className="company-row">
          <div className="company-mini" style={{ background: app.logoBg, color: app.logoColor }}>
            {app.initials}
          </div>
          {app.company}
        </div>
      </td>
      <td>{app.role}</td>
      <td><span className="tag tag-field">{app.typeDisplay || app.type}</span></td>
      <td>{app.applied}</td>
      <td>{app.deadline}</td>
      <td><span className={`status-pill ${status.cls}`}>{status.label}</span></td>
      <td>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onView?.('applications')}>View</button>
      </td>
    </tr>
  )
}

/* ═══ Dashboard Page ═══════════════════════════════════════════ */
export default function Dashboard({ setActiveNav }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [applications, setApplications] = useState([])
  const [recommended, setRecommended] = useState([])
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyOpportunity, setApplyOpportunity] = useState(null)
  const [detailOpportunity, setDetailOpportunity] = useState(null)

  const refreshData = () => {
    applicationService.getAll().then(r => r.data).then(appsData => {
      setApplications(Array.isArray(appsData) ? appsData.map((a, i) => {
        const opp = a.opportunityId || {}
        const colors = getLogoColors(i)
        const typeDisplay = opp.type === 'attachment' ? 'Industrial Attachment' : opp.type === 'internship' ? 'Internship' : opp.type
        return { id: a._id, company: opp.company || '—', role: opp.title || '—', type: a.type, typeDisplay, applied: formatDate(a.createdAt), deadline: formatDate(opp.deadline), status: a.status, initials: getInitials(opp.company), logoBg: colors.bg, logoColor: colors.color }
      }) : [])
    }).catch(() => {})
    dashboardService.getStats().then(r => r.data).then(s => setStats(s)).catch(() => {})
    dashboardService.getActivity(10).then(r => r.data).then(activityData => {
      setActivity(activityData.map((a) => {
        const opp = a.opportunity || {}
        const statusPhrase = a.status === 'accepted' ? 'Accepted' : a.status === 'rejected' ? 'Not selected' : a.status === 'pending_payment' ? 'Pending payment' : 'Application submitted'
        return { id: a._id || a.id, type: a.status === 'accepted' ? 'green' : a.status === 'rejected' ? 'amber' : a.status === 'pending_payment' ? 'orange' : 'blue', statusPhrase, title: opp.title || 'Role', company: opp.company || 'Company', time: formatActivityTime(a.createdAt) }
      }))
    }).catch(() => {})
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'done') {
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(refreshData, 1500)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      dashboardService.getStats().then(r => r.data).catch(() => ({ opportunities: 0, applications: 0, myApplications: 0 })),
      dashboardService.getActivity(10).then(r => r.data).catch(() => []),
      applicationService.getAll().then(r => r.data).catch(() => []),
      opportunityService.getRecommended().then(r => r.data).catch(() => []),
      opportunityService.getSaved().then(r => r.data).catch(() => []),
    ]).then(([statsData, activityData, appsData, recData, savedData]) => {
      if (cancelled) return
      setStats(statsData)
      setActivity(activityData.map((a) => {
        const opp = a.opportunity || {}
        const statusPhrase = a.status === 'accepted' ? 'Accepted' : a.status === 'rejected' ? 'Not selected' : a.status === 'pending_payment' ? 'Pending payment' : 'Application submitted'
        return { id: a._id || a.id, type: a.status === 'accepted' ? 'green' : a.status === 'rejected' ? 'amber' : a.status === 'pending_payment' ? 'orange' : 'blue', statusPhrase, title: opp.title || 'Role', company: opp.company || 'Company', time: formatActivityTime(a.createdAt) }
      }))
      setApplications(Array.isArray(appsData) ? appsData.map((a, i) => {
        const opp = a.opportunityId || {}
        const colors = getLogoColors(i)
        const typeDisplay = opp.type === 'attachment' ? 'Industrial Attachment' : opp.type === 'internship' ? 'Internship' : opp.type
        return {
          id: a._id,
          company: opp.company || '—',
          role: opp.title || '—',
          type: a.type,
          typeDisplay,
          applied: formatDate(a.createdAt),
          deadline: formatDate(opp.deadline),
          status: a.status,
          initials: getInitials(opp.company),
          logoBg: colors.bg,
          logoColor: colors.color,
        }
      }) : [])
      setRecommended(Array.isArray(recData) ? recData.map((o, i) => {
        const colors = getLogoColors(i)
        const typeDisplay = o.type === 'attachment' ? 'Industrial Attachment' : o.type === 'internship' ? 'Internship' : o.type
        return {
          id: o._id,
          _id: o._id,
          title: o.title,
          company: o.company,
          location: o.location,
          type: o.type,
          typeDisplay,
          category: o.category,
          closingDate: o.deadline ? formatDate(o.deadline) : '—',
          deadline: o.deadline,
          description: o.description,
          requirements: o.requirements,
          duration: o.duration,
          logoInitials: getInitials(o.company),
          logoBg: colors.bg,
          logoColor: colors.color,
          applicationFee: o.applicationFee ?? 350,
        }
      }) : [])
      setSaved(Array.isArray(savedData) ? savedData : [])
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const statsList = stats ? [
    { id: 1, label: 'Applications Sent',    value: stats.myApplications ?? stats.applications ?? 0,  color: 'orange' },
    { id: 2, label: 'Interviews Scheduled', value: 0,  color: 'green' },
    { id: 3, label: 'Profile Views',        value: 0,  color: 'blue' },
    { id: 4, label: 'Saved Roles',          value: saved.length, color: 'amber' },
  ] : []

  const filteredOpps = activeFilter === 'All'
    ? recommended
    : recommended.filter(o => (o.category || '').toLowerCase() === activeFilter.toLowerCase() || (o.typeDisplay || o.type || '').toLowerCase().includes(activeFilter.toLowerCase()))

  const opportunitiesCount = stats?.opportunities ?? 0

  return (
    <div className="content">
      {detailOpportunity && (
        <OpportunityDetailModal
          opportunity={detailOpportunity}
          onClose={() => setDetailOpportunity(null)}
          onApply={(opp) => { setDetailOpportunity(null); setApplyOpportunity(opp); }}
        />
      )}
      {applyOpportunity && (
        <ApplyForm
          opportunity={applyOpportunity}
          onSuccess={() => {
          setApplyOpportunity(null)
          applicationService.getAll().then(r => r.data).then(appsData => {
            setApplications(Array.isArray(appsData) ? appsData.map((a, i) => {
              const opp = a.opportunityId || {}
              const colors = getLogoColors(i)
              const typeDisplay = opp.type === 'attachment' ? 'Industrial Attachment' : opp.type === 'internship' ? 'Internship' : opp.type
              return { id: a._id, company: opp.company || '—', role: opp.title || '—', type: a.type, typeDisplay, applied: formatDate(a.createdAt), deadline: formatDate(opp.deadline), status: a.status, initials: getInitials(opp.company), logoBg: colors.bg, logoColor: colors.color }
            }) : [])
          }).catch(() => {})
          dashboardService.getStats().then(r => r.data).then(s => setStats(s)).catch(() => {})
          dashboardService.getActivity(10).then(r => r.data).then(activityData => {
            setActivity(activityData.map((a) => {
              const opp = a.opportunity || {}
              const statusPhrase = a.status === 'accepted' ? 'Accepted' : a.status === 'rejected' ? 'Not selected' : a.status === 'pending_payment' ? 'Pending payment' : 'Application submitted'
              return { id: a._id || a.id, type: a.status === 'accepted' ? 'green' : a.status === 'rejected' ? 'amber' : a.status === 'pending_payment' ? 'orange' : 'blue', statusPhrase, title: opp.title || 'Role', company: opp.company || 'Company', time: formatActivityTime(a.createdAt) }
            }))
          }).catch(() => {})
        }}
          onCancel={() => setApplyOpportunity(null)}
        />
      )}
      {/* Hero Strip */}
      <div className="hero-strip animate-fade-up" style={{ animationDelay: '.05s' }}>
        <div className="hero-text">
          <div className="hero-greeting">👋 Welcome back</div>
          <h2 className="hero-heading">
            Find your perfect internship<br />&amp; industrial attachment
          </h2>
          <p className="hero-sub">
            {opportunitiesCount > 0 ? `${opportunitiesCount} opportunity${opportunitiesCount !== 1 ? 'ies' : ''} available — apply and track from your dashboard.` : 'Complete your profile and browse opportunities to get started.'}
          </p>
        </div>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => setActiveNav?.('browse')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse Roles
          </button>
          <button className="btn btn-ghost" onClick={() => setActiveNav?.('profile')}>Complete Profile</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ animationDelay: '.12s' }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-fade-up" style={{ animationDelay: `${0.12 + i * 0.05}s` }}>
              <div className={`stat-icon icon-${['orange','green','blue','amber'][i]}`}>{[STAT_ICONS.orange, STAT_ICONS.green, STAT_ICONS.blue, STAT_ICONS.amber][i]}</div>
              <div className="stat-value">—</div>
              <div className="stat-label">{['Applications Sent','Interviews Scheduled','Profile Views','Saved Roles'][i]}</div>
            </div>
          ))
        ) : (
          statsList.map((stat, i) => (
            <StatCard key={stat.id} stat={stat} delay={0.12 + i * 0.05} />
          ))
        )}
      </div>

      {/* 2-col grid */}
      <div className="grid-2 animate-fade-up" style={{ animationDelay: '.2s' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              Recommended for You
              <span>based on your profile</span>
            </div>
            <button className="view-all" onClick={() => setActiveNav?.('browse')}>
              View all <IconChevronRight size={12} />
            </button>
          </div>
          <div className="filter-row">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                className={`filter-chip ${activeFilter === tab ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm">
              <IconFilter size={13} /> Filter
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: '8px' }}>
            <div className="opp-list">
              {loading ? (
                <p style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>Loading…</p>
              ) : filteredOpps.length > 0 ? (
                filteredOpps.map(opp => <OpportunityItem key={opp.id} opp={opp} onApply={setApplyOpportunity} onShowDetails={setDetailOpportunity} />)
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>No opportunities in this category yet. Browse all roles to find a fit.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <button className="view-all" onClick={() => setActiveNav?.('notifications')}>
              All activity <IconChevronRight size={12} />
            </button>
          </div>
          <div className="card-body">
            <div className="activity-list">
              {loading ? (
                <p style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>Loading…</p>
              ) : activity.length > 0 ? (
                activity.map(item => <ActivityItem key={item.id} item={item} />)
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>No recent activity. Your application updates will appear here.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card animate-fade-up" style={{ animationDelay: '.28s' }}>
        <div className="card-header">
          <div className="card-title">
            My Applications <span>{applications.length} total</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveNav?.('browse')}>
            <IconPlus size={14} /> New Application
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Type</th>
                <th>Applied</th>
                <th>Deadline</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 24, color: 'var(--text3)', textAlign: 'center' }}>Loading…</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 24, color: 'var(--text3)', textAlign: 'center' }}>No applications yet. Browse opportunities and apply to get started.</td></tr>
              ) : (
                applications.map(app => <ApplicationRow key={app.id} app={app} onView={setActiveNav} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
