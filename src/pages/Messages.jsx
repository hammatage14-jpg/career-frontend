import { useState, useEffect } from 'react'
import { messageService } from '../services/api'
import styles from './Applications.module.css'

export default function Messages() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    messageService.getAll()
      .then(res => setList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>Messages</h2>
      {loading ? (
        <p className={styles.msg}>Loading…</p>
      ) : list.length === 0 ? (
        <p className={styles.msg}>No messages yet. When recruiters contact you, they’ll appear here.</p>
      ) : (
        <p className={styles.msg}>You have {list.length} message(s).</p>
      )}
    </div>
  )
}
