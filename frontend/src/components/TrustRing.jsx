export default function TrustRing({ score = 0, verdict = 'checking', size = 64 }) {
  const stroke = Math.max(5, size / 11)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = verdict === 'checking' ? 0 : score / 100
  const mid = size / 2

  return (
    <svg
      className={`ring ring-${verdict}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={verdict === 'checking' ? 'Trust score pending' : `Trust score ${score} out of 100`}
    >
      <circle className="ring-track" cx={mid} cy={mid} r={r} strokeWidth={stroke} fill="none" />
      <circle
        className="ring-value"
        cx={mid}
        cy={mid}
        r={r}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${mid} ${mid})`}
      />
      <text className="ring-num" x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.34}>
        {verdict === 'checking' ? '…' : score}
      </text>
    </svg>
  )
}
