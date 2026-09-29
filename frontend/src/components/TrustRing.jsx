import { useId } from 'react'

const WORD = { publish: 'ALLOWED', review: 'REVIEW', reject: 'BLOCKED', checking: 'SCANNING' }
const COLOR_VAR = { publish: 'var(--allow)', review: 'var(--review)', reject: 'var(--block)', checking: 'var(--scan)' }

// Trust score as a glowing scan-meter: a dark track, a lit arc for the score,
// and a spinning sweep while the safety check is still running.
export default function TrustRing({ score = 0, verdict = 'checking', size = 64 }) {
  const uid = useId()
  const glowId = `meter-glow-${uid}`
  const stroke = Math.max(4, size / 12)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = verdict === 'checking' ? 0.22 : score / 100
  const mid = size / 2
  const color = COLOR_VAR[verdict] || COLOR_VAR.checking
  const label = verdict === 'checking' ? 'Scanning, trust score pending' : `Trust score ${score} out of 100, ${WORD[verdict]}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className={verdict === 'checking' ? 'meter-spin' : undefined}
    >
      <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={size * 0.05} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <circle className="ring-track" cx={mid} cy={mid} r={r} strokeWidth={stroke} fill="none" stroke="var(--line)" />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        strokeWidth={stroke}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${mid} ${mid})`}
        filter={`url(#${glowId})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {verdict !== 'checking' && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.32} className="meter-num" fill={color}>
          {score}
        </text>
      )}
    </svg>
  )
}
