import { useState, useEffect } from 'react'
import { opportunityService } from '../services/api'
import styles from './Browse.module.css'

export default function Saved() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    opportunityService.getSaved()
      .then(res => setOpportunities(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.content}><p className={styles.msg}>Loading…</p></div>
  if (opportunities.length === 0) {
    return (
      <div className={styles.content}>
        <h2 className={styles.title}>Saved Roles</h2>
        <p className={styles.msg}>You have not saved any roles yet. Browse opportunities and use the bookmark to save them.</p>
      </div>
    )
  }

  const getInitials = (company) => (company || '??').slice(0, 2).toUpperCase()

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>Saved Roles</h2>
      <p className={styles.meta}>{opportunities.length} saved</p>
      <div className={styles.grid}>
        {opportunities.map(opp => (
          <article key={opp._id} className={styles.card}>
            <div className={styles.cardLogo}>{getInitials(opp.company)}</div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{opp.title}</h3>
              <p className={styles.cardCompany}>{opp.company}</p>
              <div className={styles.tags}>
                <span className={styles.tag}>{opp.type}</span>
                {opp.location && <span className={styles.tag}>{opp.location}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
