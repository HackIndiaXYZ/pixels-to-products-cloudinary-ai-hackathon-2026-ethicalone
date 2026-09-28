import TrustRing from './TrustRing'
import { computeTrust, effectiveChecks, LABELS, VERDICT } from '../lib/trustScore'

const DECISION_LABEL = { approved: 'Approved by reviewer', rejected: 'Rejected by reviewer' }

export default function AssetCard({ asset, onOpen }) {
  const { score, verdict } = computeTrust(asset)
  const checks = effectiveChecks(asset)
  const name = asset.cloudinaryPublicId?.split('/').pop() || 'Untitled'
  const failed = Object.keys(LABELS).filter((k) => checks[k] && !checks[k].passed)

  let note = asset.fixApplied ? 'Fixed automatically, all checks passed' : 'All checks passed'
  if (verdict === 'checking') note = 'Waiting for moderation…'
  else if (failed.length) note = `Failed: ${failed.map((k) => LABELS[k]).join(', ')}`

  return (
    <button type="button" className={`card card-${verdict}`} onClick={() => onOpen(asset._id)}>
      <div className="card-thumb">
        <img src={asset.fixedUrl || asset.originalUrl} alt="" loading="lazy" />
      </div>
      <div className="card-body">
        <div className="card-head">
          <div className="card-title">
            <strong title={name}>{name}</strong>
            <span className={`chip chip-${verdict}`}>{VERDICT[verdict].label}</span>
          </div>
          <TrustRing score={score} verdict={verdict} size={52} />
        </div>
        <p className="card-note">{note}</p>
        {DECISION_LABEL[asset.decision] && <p className="card-decision">{DECISION_LABEL[asset.decision]}</p>}
      </div>
    </button>
  )
}
