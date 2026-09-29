import { useState } from 'react'
import { api, errMsg } from '../api/assets'
import { buildFixUrl } from '../lib/fix'

export default function FixPreview({ asset, rules, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fixable = ['dimensions', 'format'].some((k) => asset.checks?.[k] && !asset.checks[k].passed)
  if (!fixable && !asset.fixApplied) return null

  if (asset.fixApplied) {
    return (
      <div className="fix">
        <h3>Fix applied</h3>
        <div className="ba">
          <figure><img src={asset.originalUrl} alt="Original" /><figcaption>Original</figcaption></figure>
          <figure><img src={asset.fixedUrl} alt="Fixed" /><figcaption>Fixed</figcaption></figure>
        </div>
      </div>
    )
  }

  const fix = buildFixUrl(asset.originalUrl, asset.checks, rules)
  if (!fix) {
    return (
      <div className="fix">
        <h3>Fix</h3>
        <p className="muted">Preview is not available until the brand rules have loaded.</p>
      </div>
    )
  }

  async function apply() {
    setBusy(true)
    setError('')
    try {
      onChange(await api.applyFix(asset._id))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fix">
      <h3>Fix available</h3>
      <p className="muted">{fix.steps.join(', ')}.</p>
      <div className="ba">
        <figure><img src={asset.originalUrl} alt="Original" /><figcaption>Original</figcaption></figure>
        <figure><img src={fix.url} alt="Preview after fix" /><figcaption>After fix</figcaption></figure>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={apply}>
        {busy ? 'Applying…' : 'Apply fix'}
      </button>
    </div>
  )
}
