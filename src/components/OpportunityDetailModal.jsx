import styles from './OpportunityDetailModal.module.css'

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function typeLabel(t) {
  return t === 'attachment' ? 'Industrial Attachment' : t === 'internship' ? 'Internship' : t || ''
}

export default function OpportunityDetailModal({ opportunity, onClose, onApply }) {
  if (!opportunity) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{opportunity.title}</h2>
          <p className={styles.company}>{opportunity.company}</p>
          <div className={styles.meta}>
            <span className={styles.tag}>{typeLabel(opportunity.type)}</span>
            {opportunity.location && <span className={styles.tag}>{opportunity.location}</span>}
            {opportunity.duration && <span className={styles.tag}>{opportunity.duration}</span>}
            {opportunity.category && <span className={styles.tag}>{opportunity.category}</span>}
            {opportunity.deadline && (
              <span className={styles.tag}>Closes {formatDate(opportunity.deadline)}</span>
            )}
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.body}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{opportunity.description || 'No description provided.'}</p>
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>Requirements</h3>
              <ul className={styles.list}>
                {opportunity.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className={styles.actions}>
          {onApply && (
            <button type="button" className={styles.applyBtn} onClick={() => { onApply(opportunity); onClose(); }}>
              Apply
            </button>
          )}
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
