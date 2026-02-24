import { useState, useEffect } from 'react'
import { opportunityService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IconBookmark } from '../components/Icons'
import ApplyForm from '../components/ApplyForm'
import OpportunityDetailModal from '../components/OpportunityDetailModal'
import styles from './Browse.module.css'

export default function Browse() {
  const [opportunities, setOpportunities] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [savedIds, setSavedIds] = useState(new Set())
  const [applyOpportunity, setApplyOpportunity] = useState(null)
  const [detailOpportunity, setDetailOpportunity] = useState(null)
  const { user } = useAuth()

  const typeLabel = (t) => (t === 'attachment' ? 'Industrial Attachment' : t === 'internship' ? 'Internship' : t || '')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    opportunityService.getAll({ page, limit: 12, search: search || undefined })
      .then(res => {
        if (!cancelled) {
          setOpportunities(res.data.opportunities || [])
          setTotal(res.data.total || 0)
        }
      })
      .catch(() => { if (!cancelled) setOpportunities([]); setTotal(0) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, search])

  useEffect(() => {
    if (!user) return
    opportunityService.getSaved()
      .then(res => {
        const ids = new Set((res.data || []).map(o => o._id))
        setSavedIds(ids)
      })
      .catch(() => {})
  }, [user])

  const toggleSave = (id) => {
    const isSaved = savedIds.has(id)
    const promise = isSaved ? opportunityService.unsave(id) : opportunityService.save(id)
    promise
      .then(() => {
        setSavedIds(prev => {
          const next = new Set(prev)
          if (isSaved) next.delete(id)
          else next.add(id)
          return next
        })
      })
      .catch(() => {})
  }

  const getInitials = (company) => (company || '??').slice(0, 2).toUpperCase()

  return (
    <div className={styles.content}>
      {applyOpportunity && (
        <ApplyForm
          opportunity={applyOpportunity}
          onSuccess={() => setApplyOpportunity(null)}
          onCancel={() => setApplyOpportunity(null)}
        />
      )}
      {detailOpportunity && (
        <OpportunityDetailModal
          opportunity={detailOpportunity}
          onClose={() => setDetailOpportunity(null)}
          onApply={user ? (opp) => { setDetailOpportunity(null); setApplyOpportunity(opp); } : undefined}
        />
      )}
      <div className={styles.header}>
        <h2 className={styles.title}>Browse Opportunities</h2>
        <input
          type="search"
          placeholder="Search by title, company…"
          className={styles.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <p className={styles.msg}>Loading…</p>
      ) : opportunities.length === 0 ? (
        <p className={styles.msg}>No opportunities found. Try a different search or check back later.</p>
      ) : (
        <>
          <p className={styles.meta}>{total} opportunity{total !== 1 ? 's' : ''} found</p>
          <div className={styles.grid}>
            {opportunities.map(opp => (
              <article key={opp._id} className={styles.card}>
                <div className={styles.cardLogo}>{getInitials(opp.company)}</div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{opp.title}</h3>
                  <p className={styles.cardCompany}>{opp.company}</p>
                  <div className={styles.tags}>
                    <span className={styles.tag}>{opp.type === 'attachment' ? 'Industrial Attachment' : opp.type === 'internship' ? 'Internship' : opp.type}</span>
                    {opp.location && <span className={styles.tag}>{opp.location}</span>}
                  </div>
                  <button type="button" className={styles.seeMoreBtn} onClick={() => setDetailOpportunity(opp)}>
                    See more details
                  </button>
                </div>
                <div className={styles.cardActions}>
                  {user && (
                    <>
                      <button
                        type="button"
                        className={styles.applyBtn}
                        onClick={() => setApplyOpportunity(opp)}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={() => toggleSave(opp._id)}
                        title={savedIds.has(opp._id) ? 'Unsave' : 'Save'}
                        aria-label={savedIds.has(opp._id) ? 'Remove from saved' : 'Save'}
                      >
                        <IconBookmark size={16} fill={savedIds.has(opp._id) ? 'currentColor' : 'none'} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
          {total > 12 && (
            <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span className={styles.pageNum}>Page {page}</span>
              <button type="button" className={styles.pageBtn} disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
