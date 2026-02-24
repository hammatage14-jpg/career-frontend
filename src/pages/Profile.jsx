import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/api'
import styles from './Profile.module.css'

export default function Profile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    profileService.get()
      .then(res => {
        const u = res.data
        setProfile(u)
        setName(u?.name ?? '')
        setEmail(u?.email ?? '')
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [authUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    profileService.update({ name, email })
      .then(res => { setProfile(res.data); setMessage('Profile updated.'); })
      .catch(err => setMessage(err.response?.data?.message || 'Update failed.'))
      .finally(() => setSaving(false))
  }

  const handleCvChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    profileService.uploadCV(file)
      .then(res => { setProfile(res.data); setMessage('CV uploaded.'); })
      .catch(err => setMessage(err.response?.data?.message || 'Upload failed.'))
      .finally(() => setSaving(false))
  }

  if (loading) return <div className={styles.content}><p className={styles.msg}>Loading…</p></div>

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>My Profile</h2>
      {message && <p className={styles.message}>{message}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
        </label>
        <label className={styles.label}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} />
        </label>
        <button type="submit" className={styles.btn} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
      <div className={styles.section}>
        <h3 className={styles.subtitle}>CV</h3>
        {profile?.cvUrl ? (
          <p className={styles.cvLink}><a href={profile.cvUrl} target="_blank" rel="noopener noreferrer">View current CV</a></p>
        ) : null}
        <label className={styles.uploadLabel}>
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} className={styles.fileInput} />
          Upload new CV
        </label>
      </div>
    </div>
  )
}
