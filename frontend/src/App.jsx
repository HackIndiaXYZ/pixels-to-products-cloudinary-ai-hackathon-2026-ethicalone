import { useCallback, useEffect, useState } from 'react'
import { api, errMsg, isMock } from './api/assets'
import { computeTrust } from './lib/trustScore'
import UploadPanel from './components/UploadPanel'
import AssetDashboard from './components/AssetDashboard'
import AssetDetail from './components/AssetDetail'
import './App.css'

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

  // Moderation can finish after upload, so keep polling while any asset is still waiting.
  const hasPending = assets.some((a) => computeTrust(a).verdict === 'checking')
  useEffect(() => {
    if (!hasPending) return undefined
    const t = setInterval(() => api.listAssets().then(setAssets).catch(() => {}), 6000)
    return () => clearInterval(t)
  }, [hasPending])

  const replaceAsset = (updated) => setAssets((list) => list.map((a) => (a._id === updated._id ? updated : a)))
  const closeDetail = useCallback(() => setOpenId(null), [])
  const open = assets.find((a) => a._id === openId)

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>Content Firewall</h1>
          <p>Every image gets checked and scored before it goes live.</p>
        </div>
        {isMock && <span className="chip chip-idle">Demo data</span>}
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
                  <dt>Minimum size</dt>
                  <dd>{rules.minWidth}×{rules.minHeight}px</dd>
                  <dt>Formats</dt>
                  <dd>{rules.allowedFormats?.join(', ').toUpperCase()}</dd>
                  <dt>Brand colors</dt>
                  <dd className="swatches">
                    {rules.brandColors?.map((c) => (
                      <span key={c} className="swatch" style={{ background: c }} title={c} />
                    ))}
                  </dd>
                </dl>
              </div>
            )}
          </div>
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
