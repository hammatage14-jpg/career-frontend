import styles from './CareerGuidance.module.css'

const TIPS = [
  {
    title: 'Industrial attachment vs internship',
    body: 'Industrial attachment is usually required by your course and tied to your institution (with a recommendation letter). Internships are often open applications. Both give you real-world experience — list them clearly on your CV and in applications.',
  },
  {
    title: 'Writing a strong cover letter',
    body: 'Keep it to one page. Start with why you want this role and this company. Match 2–3 of your skills or experiences to the job description. End with a clear ask (e.g. "I would welcome the chance to discuss this role further").',
  },
  {
    title: 'Preparing for interviews',
    body: 'Research the company and the role. Prepare examples using the STAR method (Situation, Task, Action, Result). Have questions ready to ask them. Test your camera and internet if it’s online; be on time and dressed appropriately if in person.',
  },
  {
    title: 'Getting a recommendation letter',
    body: 'Ask your department or placement office early. Provide your CV and the type of role you’re applying for. Give them at least 1–2 weeks. Thank them and keep them updated when you secure a placement.',
  },
  {
    title: 'Managing multiple applications',
    body: 'Use the application tracker on your dashboard. Set calendar reminders for deadlines. Tailor each cover letter — avoid sending the same text to every company. Follow up only if the listing says you may.',
  },
]

const RESOURCES = [
  { label: 'University career office', desc: 'Check your institution’s career or industrial attachment office for deadlines and approved employers.' },
  { label: 'LinkedIn', desc: 'Build a profile and connect with recruiters and alumni in your field.' },
  { label: 'IAS opportunities', desc: 'Browse and apply to internships and industrial attachments directly from this platform.' },
]

export default function CareerGuidance() {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Career Guidance</h2>
      <p className={styles.subtitle}>Tips and resources for internships and industrial attachments in Kenya.</p>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tips</h3>
        <div className={styles.tipList}>
          {TIPS.map((tip, i) => (
            <div key={i} className={styles.card}>
              <h4 className={styles.tipTitle}>{tip.title}</h4>
              <p className={styles.tipBody}>{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resources</h3>
        <div className={styles.resourceList}>
          {RESOURCES.map((r, i) => (
            <div key={i} className={styles.resourceCard}>
              <span className={styles.resourceLabel}>{r.label}</span>
              <p className={styles.resourceDesc}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
