import { useState } from 'react'
import { applicationService } from '../services/api'
import styles from './ApplyForm.module.css'

const FEE_DEFAULT = 350

export default function ApplyForm({ opportunity, onSuccess, onCancel }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState(null)
  const [recommendationLetter, setRecommendationLetter] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAttachment = opportunity?.type === 'attachment'
  const fee = opportunity?.applicationFee ?? FEE_DEFAULT
  const canSubmit = resume && (isAttachment ? recommendationLetter : true) && coverLetter.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) {
      setError('Please fill all required fields: cover letter, resume' + (isAttachment ? ', and recommendation letter' : '') + '.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        opportunityId: opportunity._id,
        coverLetter: coverLetter.trim(),
        resume,
        recommendationLetter: isAttachment ? recommendationLetter : undefined,
      }
      const res = await applicationService.create(payload)
      const data = res.data

      if (data.paymentLink) {
        window.location.href = data.paymentLink
        return
      }
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Apply for {opportunity?.title}</h2>
          <p className={styles.company}>{opportunity?.company}</p>
          <p className={styles.fee}>Application fee: KES {fee}</p>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <label className={styles.label}>
              Cover letter <span className={styles.required}>*</span>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className={styles.textarea}
                rows={4}
                required
                placeholder="Why are you a good fit?"
              />
            </label>
            <label className={styles.label}>
              Resume (PDF/DOC) <span className={styles.required}>*</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className={styles.fileInput}
                required
              />
              {resume && <span className={styles.fileName}>{resume.name}</span>}
            </label>
            {isAttachment && (
              <label className={styles.label}>
                Recommendation letter <span className={styles.required}>*</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setRecommendationLetter(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                  required
                />
                {recommendationLetter && <span className={styles.fileName}>{recommendationLetter.name}</span>}
              </label>
            )}
            <p className={styles.hint}>You will be redirected to pay (M-Pesa or Card) after submitting. On the payment page, choose M-Pesa and enter 254XXXXXXXXX.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.btnSecondary} onClick={onCancel}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={loading || !canSubmit}>
                {loading ? 'Submitting…' : `Submit & Pay KES ${fee}`}
              </button>
            </div>
          </form>

      </div>
    </div>
  )
}
