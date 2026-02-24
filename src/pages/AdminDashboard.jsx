import { useState, useEffect } from 'react'
import { opportunityService, applicationService, dashboardService } from '../services/api'
import styles from './AdminDashboard.module.css'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const formatDateShort = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [applications, setApplications] = useState([])
  const [appStats, setAppStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // overview | opportunities | applications
  const [appStatusFilter, setAppStatusFilter] = useState('all') // all | pending | completed
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', company: '', type: 'internship', description: '', location: '', duration: '', applicationFee: 350, isActive: true })
  const [refunding, setRefunding] = useState(null)
  const [sendingReminder, setSendingReminder] = useState(null)

  useEffect(() => {
    dashboardService.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      dashboardService.getStats().then(r => r.data).catch(() => null),
      opportunityService.getAdminAll({ limit: 50 }).then(r => r.data.opportunities || []).catch(() => []),
      dashboardService.getApplicationsStatus({ status: appStatusFilter === 'all' ? undefined : appStatusFilter, limit: 50 }).then(r => r.data).catch(() => ({ applications: [], stats: {} })),
    ]).then(([s, opps, appsData]) => {
      if (!cancelled) {
        setStats(s)
        setOpportunities(opps)
        setApplications(appsData.applications)
        setAppStats(appsData.stats)
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [appStatusFilter])

  const handleCreateOrUpdate = (e) => {
    e.preventDefault()
    const promise = editing
      ? opportunityService.update(editing._id, form)
      : opportunityService.create(form)
    promise
      .then(() => {
        setShowForm(false)
        setEditing(null)
        setForm({ title: '', company: '', type: 'internship', description: '', location: '', duration: '', applicationFee: 350, isActive: true })
        opportunityService.getAdminAll({ limit: 100 }).then(r => setOpportunities(r.data.opportunities || []))
      })
      .catch(() => {})
  }

  const openEdit = (opp) => {
    setEditing(opp)
    setForm({
      title: opp.title || '',
      company: opp.company || '',
      type: opp.type || 'internship',
      description: opp.description || '',
      location: opp.location || '',
      duration: opp.duration || '',
      applicationFee: opp.applicationFee ?? 500,
      isActive: opp.isActive !== false,
    })
    setShowForm(true)
  }

  const statusLabel = (s) => ({ pending_payment: 'Pending payment', submitted: 'Received', under_review: 'Being processed', shortlisted: 'Shortlisted', rejected: 'Rejected', accepted: 'Accepted' }[s] || s)

  const STATUS_OPTIONS = [
    { value: 'submitted', label: 'Received' },
    { value: 'under_review', label: 'Being processed' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'accepted', label: 'Accepted' },
  ]

  const handleStatusChange = (appId, newStatus) => {
    applicationService.updateStatusAdmin(appId, newStatus)
      .then(res => {
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: res.data.status } : a))
      })
      .catch(() => {})
  }

  const handleRefund = (app) => {
    if (!window.confirm(`Refund KES ${app.amountPaid ?? app.opportunityId?.applicationFee ?? 350} to ${app.userId?.name || app.userId?.email}?`)) return
    setRefunding(app._id)
    applicationService.refundAdmin(app._id)
      .then(() => {
        setApplications(prev => prev.map(a => a._id === app._id ? { ...a, refundedAt: new Date().toISOString() } : a))
      })
      .catch(err => alert(err.response?.data?.message || 'Refund failed'))
      .finally(() => setRefunding(null))
  }

  const handleSendReminder = (app) => {
    setSendingReminder(app._id)
    applicationService.sendReminderAdmin(app._id)
      .then(() => {
        alert(`Reminder sent to ${app.applicant?.email || 'applicant'}`)
      })
      .catch(err => alert(err.response?.data?.message || 'Failed to send reminder'))
      .finally(() => setSendingReminder(null))
  }

  if (loading && !stats) {
    return <div className={styles.content}><p className={styles.msg}>Loading…</p></div>
  }

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>Admin Dashboard</h2>
      <div className={styles.tabs}>
        <button type="button" className={tab === 'overview' ? styles.tabActive : styles.tab} onClick={() => setTab('overview')}>Overview</button>
        <button type="button" className={tab === 'opportunities' ? styles.tabActive : styles.tab} onClick={() => setTab('opportunities')}>Opportunities</button>
        <button type="button" className={tab === 'applications' ? styles.tabActive : styles.tab} onClick={() => setTab('applications')}>Applications</button>
      </div>

      {tab === 'overview' && stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.opportunities ?? 0}</span>
            <span className={styles.statLabel}>Opportunities</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.applications ?? 0}</span>
            <span className={styles.statLabel}>Total applications</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.myApplications ?? 0}</span>
            <span className={styles.statLabel}>Your applications</span>
          </div>
        </div>
      )}

      {tab === 'opportunities' && (
        <>
          <div className={styles.toolbar}>
            <button type="button" className={styles.btnPrimary} onClick={() => { setEditing(null); setForm({ title: '', company: '', type: 'internship', description: '', location: '', duration: '', applicationFee: 350, isActive: true }); setShowForm(true); }}>
              + New opportunity
            </button>
          </div>
          {showForm && (
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>{editing ? 'Edit opportunity' : 'New opportunity'}</h3>
              <form onSubmit={handleCreateOrUpdate}>
                <label className={styles.label}>Title <input className={styles.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
                <label className={styles.label}>Company <input className={styles.input} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required /></label>
                <label className={styles.label}>Type
                  <select className={styles.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="internship">Internship</option>
                    <option value="attachment">Industrial Attachment</option>
                  </select>
                </label>
                <label className={styles.label}>Description <textarea className={styles.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} required /></label>
                <label className={styles.label}>Location <input className={styles.input} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></label>
                <label className={styles.label}>Duration <input className={styles.input} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></label>
                <label className={styles.label}>Application fee <input type="number" className={styles.input} value={form.applicationFee} onChange={e => setForm(f => ({ ...f, applicationFee: Number(e.target.value) || 0 }))} /></label>
                {editing && (
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                    Active
                  </label>
                )}
                <div className={styles.formActions}>
                  <button type="button" className={styles.btnSecondary} onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className={styles.btnPrimary}>{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          )}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {opportunities.map(opp => (
                  <tr key={opp._id}>
                    <td>{opp.title}</td>
                    <td>{opp.company}</td>
                    <td>{opp.type}</td>
                    <td><span className={opp.isActive !== false ? styles.badgeActive : styles.badgeInactive}>{opp.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td><button type="button" className={styles.linkBtn} onClick={() => openEdit(opp)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'applications' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filterButtons}>
              <button 
                type="button" 
                className={appStatusFilter === 'all' ? styles.btnActive : styles.btnSecondary}
                onClick={() => setAppStatusFilter('all')}
              >
                All {applications.length > 0 && `(${applications.length})`}
              </button>
              <button 
                type="button" 
                className={appStatusFilter === 'pending' ? styles.btnActive : styles.btnSecondary}
                onClick={() => setAppStatusFilter('pending')}
              >
                Pending {appStats?.pending > 0 && `(${appStats.pending})`}
              </button>
              <button 
                type="button" 
                className={appStatusFilter === 'completed' ? styles.btnActive : styles.btnSecondary}
                onClick={() => setAppStatusFilter('completed')}
              >
                Completed {appStats?.completed > 0 && `(${appStats.completed})`}
              </button>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Opportunity</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Updated</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app._id}>
                    <td>
                      <div>{app.applicant?.name ?? app.applicant?.email ?? '—'}</div>
                      {app.applicant?.email && <div className={styles.email}>{app.applicant.email}</div>}
                    </td>
                    <td>{app.opportunity?.title ?? '—'} ({app.opportunity?.company})</td>
                    <td>
                      {app.status === 'pending_payment' ? (
                        <span className={`${styles.statusPill} ${styles.statusPillPending}`}>{statusLabel(app.status)}</span>
                      ) : (
                        <select
                          className={`${styles.statusSelect} ${app.status === 'rejected' ? styles.statusSelectRed : styles.statusSelectGreen}`}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td><small className={styles.timestamp}>{formatDateShort(app.createdAt)}</small></td>
                    <td><small className={styles.timestamp}>{formatDateShort(app.updatedAt)}</small></td>
                    <td>
                      <div className={styles.docLinks}>
                        {app.hasResume && <a href="#" className={styles.docLink}>Resume</a>}
                        {app.hasCoverLetter && <a href="#" className={styles.docLink}>Letter</a>}
                        {!app.hasResume && !app.hasCoverLetter && '—'}
                      </div>
                    </td>
                    <td>
                      {!app.refundedAt && app.status !== 'pending_payment' && app.amountPaid && (
                        <button
                          type="button"
                          className={styles.refundBtn}
                          onClick={() => handleRefund(app)}
                          disabled={refunding === app._id}
                          title="Refund to original payment method"
                        >
                          {refunding === app._id ? '…' : 'Refund'}
                        </button>
                      )}
                      {app.status === 'pending_payment' && (
                        <button
                          type="button"
                          className={styles.reminderBtn}
                          onClick={() => handleSendReminder(app)}
                          disabled={sendingReminder === app._id}
                          title="Send reminder email to user"
                        >
                          {sendingReminder === app._id ? '…' : '📧 Remind'}
                        </button>
                      )}
                      {app.refundedAt && <span className={styles.refunded}>Refunded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
