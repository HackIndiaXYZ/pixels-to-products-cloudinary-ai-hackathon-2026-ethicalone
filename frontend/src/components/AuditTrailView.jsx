import { useEffect, useState } from 'react'
import { api } from '../api/assets'

const ACTION_LABEL = {
  uploaded: 'Submitted',
  checked: 'Scanned',
  rechecked: 'Re-scanned',
  fixed: 'Fixed',
  approved: 'Allowed',
  rejected: 'Blocked',
}

export default function AuditTrailView({ assetId, refreshKey }) {
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    let live = true
    api
      .getAudit(assetId)
      .then((d) => live && setLogs(d))
      .catch(() => live && setLogs([]))
    return () => {
      live = false
    }
  }, [assetId, refreshKey])

  if (!logs) return <p className="muted">Loading log…</p>
  if (logs.length === 0) return <p className="muted">No entries yet.</p>

  const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return (
    <ol className="trail">
      {sorted.map((l, i) => (
        <li key={l._id || i}>
          <div className="trail-top">
            <strong>{ACTION_LABEL[l.action] || l.action}</strong>
            <time dateTime={l.timestamp}>{new Date(l.timestamp).toLocaleString()}</time>
          </div>
          {l.details && <p>{l.details}</p>}
        </li>
      ))}
    </ol>
  )
}
