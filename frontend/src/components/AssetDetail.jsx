import { useEffect, useState } from 'react'
import { api, errMsg } from '../api/assets'
import { computeTrust, effectiveChecks, LABELS, VERDICT } from '../lib/trustScore'
import TrustRing from './TrustRing'
import FixPreview from './FixPreview'
import AuditTrailView from './AuditTrailView'

function valueOf(key, c) {
  if (!c) return 'Not run'
  if (c.fixed) return 'Fixed'
  if (key === 'dimensions') return `${c.width}×${c.height}px`
  if (key === 'format') return String(c.value || '').toUpperCase()
  if (key === 'moderation') return c.status
  return ''
}

export default function AssetDetail({ asset, rules, onClose, onChange }) {
  const { score, verdict } = computeTrust(asset)
  const checks = effectiveChecks(asset)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [auditKey, setAuditKey] = useState(0)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      onChange(await fn())
      setAuditKey((k) => k + 1)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const name = asset.cloudinaryPublicId?.split('/').pop() || 'Untitled'
  const mod = checks.moderation
  const cannotApprove = !mod?.passed
  const modWaiting = mod?.status === 'pending' || mod?.status === 'unavailable'

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`Details for ${name}`}>
        <div className="drawer-top">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Close</button>
        </div>

        <img className="hero-img" src={asset.fixedUrl || asset.originalUrl} alt="" />

        <div className="verdict">
          <TrustRing score={score} verdict={verdict} size={84} />
          <div>
            <h2>{name}</h2>
            <span className={`chip chip-${verdict}`}>{VERDICT[verdict].label}</span>
          </div>
        </div>

        <h3>Checks</h3>
        <ul className="checks">
          {Object.entries(LABELS).map(([key, label]) => {
            const c = checks[key]
            const state = !c ? 'idle' : c.passed ? 'pass' : 'fail'
            return (
              <li key={key} className={`check check-${state}`}>
                <span className="check-mark" aria-hidden="true">{state === 'pass' ? '✓' : state === 'fail' ? '✕' : '–'}</span>
                <div>
                  <div className="check-top">
                    <strong>{label}</strong>
                    <span className="muted">{valueOf(key, c)}</span>
                    <span className="sr">{state === 'pass' ? 'Passed' : state === 'fail' ? 'Failed' : ''}</span>
                  </div>
                  {c && !c.passed && c.reason && <p className="check-reason">{c.reason}</p>}
                  {key === 'brandColor' && c?.dominantColors?.length > 0 && (
                    <div className="swatches">
                      {c.dominantColors.map((hex) => (
                        <span key={hex} className="swatch" style={{ background: hex }} title={hex} />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <FixPreview asset={asset} rules={rules} onChange={onChange} />

        <h3>Your decision</h3>
        {asset.decision !== 'pending' && (
          <p className="muted">
            Marked {asset.decision}
            {asset.decisionNote ? `: ${asset.decisionNote}` : '.'}
          </p>
        )}
        <label className="field">
          <span>Note for the audit log</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you making this call?" />
        </label>
        {cannotApprove && (
          <p className="muted">
            {modWaiting
              ? 'Approval is locked until moderation finishes. Run the checks again in a moment.'
              : 'Approval is disabled because the safety check failed.'}
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn" disabled={busy || cannotApprove} onClick={() => run(() => api.decide(asset._id, 'approved', note))}>
            Approve
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={() => run(() => api.decide(asset._id, 'rejected', note))}>
            Reject
          </button>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => run(() => api.recheck(asset._id))}>
            Run checks again
          </button>
        </div>

        <h3>History</h3>
        <AuditTrailView assetId={asset._id} refreshKey={auditKey} />
      </aside>
    </>
  )
}
