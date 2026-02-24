import { useState } from 'react'
import styles from './CVBuilder.module.css'

const emptyEdu = () => ({ school: '', degree: '', year: '' })
const emptyExp = () => ({ company: '', role: '', period: '', description: '' })

export default function CVBuilder() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState('')
  const [education, setEducation] = useState([emptyEdu()])
  const [experience, setExperience] = useState([emptyExp()])
  const [skills, setSkills] = useState('')
  const [copied, setCopied] = useState(false)

  const addEdu = () => setEducation(e => [...e, emptyEdu()])
  const removeEdu = i => setEducation(e => e.filter((_, j) => j !== i))
  const updateEdu = (i, field, value) =>
    setEducation(e => e.map((item, j) => (j === i ? { ...item, [field]: value } : item)))

  const addExp = () => setExperience(x => [...x, emptyExp()])
  const removeExp = i => setExperience(x => x.filter((_, j) => j !== i))
  const updateExp = (i, field, value) =>
    setExperience(x => x.map((item, j) => (j === i ? { ...item, [field]: value } : item)))

  const buildText = () => {
    const lines = [
      name && `${name.toUpperCase()}`,
      [email, phone].filter(Boolean).join(' · '),
      '',
      summary && `SUMMARY\n${summary}`,
      '',
      education.some(e => e.school || e.degree || e.year) && 'EDUCATION',
      ...education.filter(e => e.school || e.degree || e.year).map(e =>
        `${e.degree}${e.degree && e.school ? ' — ' : ''}${e.school}${e.year ? ` (${e.year})` : ''}`.trim()
      ).filter(Boolean),
      '',
      experience.some(e => e.company || e.role) && 'EXPERIENCE',
      ...experience.filter(e => e.company || e.role).flatMap(e => [
        `${e.role} at ${e.company}${e.period ? ` · ${e.period}` : ''}`,
        e.description || ''
      ].filter(Boolean)),
      '',
      skills.trim() && `SKILLS\n${skills.trim().replace(/\n/g, ', ')}`
    ]
    return lines.flat().filter(Boolean).join('\n')
  }

  const handleCopy = () => {
    const text = buildText()
    if (!text.trim()) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>CV Builder</h2>
      <p className={styles.subtitle}>Build a simple CV. Copy the text and paste into Word or Google Docs to format, or upload it in My Profile.</p>

      <div className={styles.grid}>
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Personal</h3>
            <label className={styles.label}>Full name <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>
            <label className={styles.label}>Email <input type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label className={styles.label}>Phone <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254..." /></label>
            <label className={styles.label}>Summary <textarea className={styles.textarea} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Short professional summary" rows={3} /></label>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Education</h3>
              <button type="button" className={styles.addBtn} onClick={addEdu}>+ Add</button>
            </div>
            {education.map((e, i) => (
              <div key={i} className={styles.block}>
                <label className={styles.label}>School <input className={styles.input} value={e.school} onChange={ev => updateEdu(i, 'school', ev.target.value)} placeholder="Institution" /></label>
                <label className={styles.label}>Degree / Course <input className={styles.input} value={e.degree} onChange={ev => updateEdu(i, 'degree', ev.target.value)} placeholder="e.g. BSc Computer Science" /></label>
                <label className={styles.label}>Year <input className={styles.input} value={e.year} onChange={ev => updateEdu(i, 'year', ev.target.value)} placeholder="e.g. 2022–2026" /></label>
                {education.length > 1 && <button type="button" className={styles.removeBtn} onClick={() => removeEdu(i)}>Remove</button>}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Experience</h3>
              <button type="button" className={styles.addBtn} onClick={addExp}>+ Add</button>
            </div>
            {experience.map((e, i) => (
              <div key={i} className={styles.block}>
                <label className={styles.label}>Company <input className={styles.input} value={e.company} onChange={ev => updateExp(i, 'company', ev.target.value)} placeholder="Company name" /></label>
                <label className={styles.label}>Role <input className={styles.input} value={e.role} onChange={ev => updateExp(i, 'role', ev.target.value)} placeholder="Your role" /></label>
                <label className={styles.label}>Period <input className={styles.input} value={e.period} onChange={ev => updateExp(i, 'period', ev.target.value)} placeholder="e.g. Jan 2024 – Jun 2024" /></label>
                <label className={styles.label}>Description <textarea className={styles.textarea} value={e.description} onChange={ev => updateExp(i, 'description', ev.target.value)} placeholder="Key responsibilities" rows={2} /></label>
                {experience.length > 1 && <button type="button" className={styles.removeBtn} onClick={() => removeExp(i)}>Remove</button>}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Skills</h3>
            <label className={styles.label}>List skills (one per line or comma-separated) <textarea className={styles.textarea} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, React, Excel" rows={4} /></label>
          </div>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.card}>
            <div className={styles.previewHead}>
              <h3 className={styles.cardTitle}>Preview</h3>
              <button type="button" className={styles.copyBtn} onClick={handleCopy} disabled={!name && !email && !summary.trim()}>
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
            <pre className={styles.preview}>{buildText() || 'Fill in the form to see your CV preview.'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
