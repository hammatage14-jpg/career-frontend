import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { applicationService } from '../services/api'
import styles from './Applications.module.css'

const STATUS_LABELS = {
  pending_payment: 'Pending payment',
  submitted: 'Submitted',
  under_review: 'In review',
  shortlisted: 'Shortlisted',
  rejected: 'Not selected',
  accepted: 'Accepted',
}
const STATUS_CLASS = {
  pending_payment: 'statusPending',
  submitted: 'statusGreen',
  under_review: 'statusGreen',
  shortlisted: 'statusGreen',
  accepted: 'statusGreen',
  rejected: 'statusRed',
}

export default function Applications() {
  const { user: authUser, refreshUser } = useAuth()
  const hasSavedCard = !!authUser?.hasSavedCard
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showCancelledMessage, setShowCancelledMessage] = useState(false)

  const refresh = () => {
    applicationService.getAll()
      .then(res => setList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    applicationService.getAll()
      .then(res => setList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cancelled') === '1') {
      setShowCancelledMessage(true)
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setShowCancelledMessage(false), 4000)
    } else if (params.get('payment') === 'done') {
      const reference = params.get('reference') || params.get('trxref')
      if (reference && reference.startsWith('APP-')) {
        applicationService.verifyPayment(reference)
          .then(res => {
            if (res.data?.verified) {
              refresh()
              refreshUser?.()
            }
          })
          .catch(() => {})
      } else {
        refresh()
      }
      setShowSuccessPopup(true)
      window.history.replaceState({}, '', window.location.pathname)
      const t = setTimeout(() => refresh(), 1500)
      const hideT = setTimeout(() => setShowSuccessPopup(false), 5000)
      return () => { clearTimeout(t); clearTimeout(hideT) }
    }
  }, [])

  const handleRemove = (id) => {
    if (!window.confirm('Remove this application from your list?')) return
    setPayError('')
    setRemoving(true)
    applicationService.withdraw(id)
      .then(() => refresh())
      .catch(err => setPayError(err.response?.data?.message || 'Could not remove application.'))
      .finally(() => setRemoving(false))
  }

  const handlePayFor = (id) => {
    setPayError('')
    setPaying(true)
    applicationService.pay(id)
      .then(res => {
        const link = res.data?.paymentLink
        if (link) {
          window.location.href = link
          return
        }
        refresh()
      })
      .catch(err => {
        setPayError(err.response?.data?.message || 'Payment request failed.')
        setPaying(false)
      })
  }

  const handlePaySavedCard = (id) => {
    setPayError('')
    setPaying(true)
    applicationService.chargeSavedCard(id)
      .then(() => {
        refresh()
      })
      .catch(err => setPayError(err.response?.data?.message || 'Charge failed.'))
      .finally(() => setPaying(false))
  }

  if (loading) return <div className={styles.content}><p className={styles.msg}>Loading…</p></div>
  if (list.length === 0) {
    return (
      <div className={styles.content}>
        {showCancelledMessage && (
          <div className={styles.cancelledBanner}>Payment was cancelled. You can try again when you have applications.</div>
        )}
        {showSuccessPopup && (
          <div className={styles.successPopup} role="alert">
            <div className={styles.successPopupInner}>
              <span className={styles.successIcon}>✓</span>
              <h3 className={styles.successTitle}>Thank you!</h3>
              <p className={styles.successText}>Thanks for submitting your application. We'll be in touch.</p>
              <button type="button" className={styles.successClose} onClick={() => setShowSuccessPopup(false)} aria-label="Close">×</button>
            </div>
          </div>
        )}
        <h2 className={styles.title}>My Applications</h2>
        <p className={styles.msg}>You have not applied to any opportunities yet. Browse roles and apply from there.</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {showCancelledMessage && (
        <div className={styles.cancelledBanner}>Payment was cancelled. You can try again from the table below.</div>
      )}
      {showSuccessPopup && (
        <div className={styles.successPopup} role="alert">
          <div className={styles.successPopupInner}>
            <span className={styles.successIcon}>✓</span>
            <h3 className={styles.successTitle}>Thank you!</h3>
            <p className={styles.successText}>Thanks for submitting your application. We'll be in touch.</p>
            <button type="button" className={styles.successClose} onClick={() => setShowSuccessPopup(false)} aria-label="Close">×</button>
          </div>
        </div>
      )}
      <h2 className={styles.title}>My Applications</h2>
      <p className={styles.meta}>{list.length} application(s)</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role / Company</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map(app => (
              <tr key={app._id}>
                <td>
                  <div className={styles.cellRole}>
                    {app.opportunityId?.title || '—'}
                    {app.opportunityId?.company && <span className={styles.company}>{app.opportunityId.company}</span>}
                  </div>
                </td>
                <td>{app.opportunityId?.type || '—'}</td>
                <td><span className={`${styles.status} ${styles[STATUS_CLASS[app.status] || 'statusPending']}`}>{STATUS_LABELS[app.status] || app.status}</span></td>
                <td>
                  <div className={styles.cellActions}>
                    {app.status === 'pending_payment' && (
                      <>
                        {hasSavedCard && (
                          <button type="button" className={styles.paySavedBtn} onClick={() => handlePaySavedCard(app._id)} disabled={paying}>
                            Pay with card
                          </button>
                        )}
                        <button type="button" className={styles.payBtn} onClick={() => handlePayFor(app._id)} disabled={paying}>Pay now</button>
                      </>
                    )}
                    {(app.status === 'pending_payment' || app.status === 'submitted') && (
                      <button type="button" className={styles.removeBtn} onClick={() => handleRemove(app._id)} disabled={removing}>
                        {removing ? '…' : 'Remove'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payError && <p className={styles.payError}>{payError}</p>}
      <p className={styles.payHint}>Pay with M-Pesa or Card: click Pay now — on the payment page choose M-Pesa and enter 254XXXXXXXXX</p>
    </div>
  )
}
