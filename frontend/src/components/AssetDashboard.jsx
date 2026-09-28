import { useState } from 'react'
import AssetCard from './AssetCard'
import { computeTrust } from '../lib/trustScore'

const TABS = [
  ['all', 'All'],
  ['publish', 'Ready'],
  ['review', 'Needs review'],
  ['reject', 'Blocked'],
]

export default function AssetDashboard({ assets, loading, onOpen, onRefresh }) {
  const [tab, setTab] = useState('all')

  const withVerdict = assets.map((a) => ({ asset: a, verdict: computeTrust(a).verdict }))
  const count = (key) => (key === 'all' ? assets.length : withVerdict.filter((x) => x.verdict === key).length)
  const visible = withVerdict.filter((x) => tab === 'all' || x.verdict === tab)

  return (
    <section aria-label="Assets">
      <div className="dash-bar">
        <div className="tabs" role="tablist">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`tab ${tab === key ? 'tab-on' : ''}`}
              onClick={() => setTab(key)}
            >
              {label} <span className="tab-count">{count(key)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-quiet" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="empty">Loading assets…</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {assets.length === 0
            ? 'No assets yet. Use Upload assets on the left to run the first check.'
            : 'Nothing in this view yet.'}
        </p>
      ) : (
        <div className="grid">
          {visible.map(({ asset }) => (
            <AssetCard key={asset._id} asset={asset} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}
