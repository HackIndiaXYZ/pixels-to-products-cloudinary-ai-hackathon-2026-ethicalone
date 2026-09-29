import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, errMsg, isMock } from './api/assets'
import { computeTrust, VERDICT } from './lib/trustScore'
import UploadPanel from './components/UploadPanel'
import AssetDashboard from './components/AssetDashboard'
import AssetDetail from './components/AssetDetail'
import './App.css'

function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function App() {
  const [rules, setRules] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([api.getRules(), api.listAssets()])
      setRules(r)
      setAssets(a)
      setError('')
    } catch (e) {
      setError(`Could not load data: ${errMsg(e)}. Check that the backend is running and VITE_API_URL is set.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Moderation can finish after upload, so keep polling while any asset is still checking.
  const hasPending = assets.some((a) => computeTrust(a).verdict === 'checking')
  useEffect(() => {
    if (!hasPending) return undefined
    const t = setInterval(() => api.listAssets().then(setAssets).catch(() => {}), 6000)
    return () => clearInterval(t)
  }, [hasPending])

  const replaceAsset = (updated) => setAssets((list) => list.map((a) => (a._id === updated._id ? updated : a)))
  const closeDetail = useCallback(() => setOpenId(null), [])
  const open = assets.find((a) => a._id === openId)

  const pendingReview = assets.filter((a) => computeTrust(a).verdict === 'review').length
  const recent = useMemo(
    () =>
      [...assets]
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5)
        .map((a) => ({ id: (a._id || '').slice(-8), ...computeTrust(a), time: a.uploadedAt })),
    [assets],
  )

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>
            Content <span>Firewall</span>
          </h1>
          <p>Every image gets checked and scored before it goes live.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isMock && <span className="badge-demo">Demo data</span>}
          <span className={`status-pill ${pendingReview > 0 ? 'is-hot' : ''}`}>
            <span className="status-dot" />
            {pendingReview > 0 ? (
              <>
                <strong>{pendingReview}</strong> awaiting review
              </>
            ) : (
              'All clear'
            )}
          </span>
        </div>
      </header>

      {error && <p className="banner">{error}</p>}

      <div className="layout">
        <aside className="side">
          <div className="panel">
            <h2>Check new media</h2>
            {isMock ? (
              <p className="muted">Uploads are off in demo mode. Set VITE_USE_MOCK=false in frontend/.env to use the real backend.</p>
            ) : (
              <div className="upload-slot">
                <UploadPanel onAssetRegistered={load} />
              </div>
            )}
            {rules && (
              <div className="rules">
                <h3>Checked against {rules.name}</h3>
                <dl>
                  <div className="spec-row"><dt>Minimum size</dt><dd>{rules.minWidth}×{rules.minHeight}px</dd></div>
                  <div className="spec-row"><dt>Formats</dt><dd>{rules.allowedFormats?.join(', ').toUpperCase()}</dd></div>
                  <div className="spec-row">
                    <dt>Brand colors</dt>
                    <dd className="swatches">
                      {rules.brandColors?.map((c) => (
                        <span key={c} className="swatch" style={{ background: c }} title={c} />
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {recent.length > 0 && (
            <div className="panel">
              <h2 style={{ fontSize: 15 }}>Recent activity</h2>
              <ul className="feed">
                {recent.map((r) => (
                  <li key={r.id}>
                    <span className="feed-id">#{r.id}</span>
                    <span className={`feed-verdict v-${r.verdict}`}>{VERDICT[r.verdict].label}</span>
                    <span className="feed-time">{timeAgo(r.time)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <main>
          <AssetDashboard assets={assets} loading={loading} onOpen={setOpenId} onRefresh={load} />
        </main>
      </div>

      {open && <AssetDetail asset={open} rules={rules} onClose={closeDetail} onChange={replaceAsset} />}
    </div>
  )
}

export default App
