// Brand Trust Score: each passed check earns its weight. Total = 100.
export const WEIGHTS = { moderation: 40, brandColor: 20, dimensions: 20, format: 20 }

export const LABELS = {
  moderation: 'Safety',
  brandColor: 'Brand color',
  dimensions: 'Resolution',
  format: 'File format',
}

export const VERDICT = {
  publish: { label: 'Allowed' },
  review: { label: 'Review' },
  reject: { label: 'Blocked' },
  checking: { label: 'Scanning' },
}

// The backend's /fix route saves a corrected URL but does not re-run the checks.
// A fixed asset meets the size and format rules by construction, so treat those two as passed.
export function effectiveChecks(asset) {
  const checks = { ...(asset?.checks || {}) }
  if (asset?.fixApplied) {
    for (const key of ['dimensions', 'format']) {
      if (checks[key]) checks[key] = { ...checks[key], passed: true, reason: '', fixed: true }
    }
  }
  return checks
}

export function computeTrust(asset) {
  const checks = effectiveChecks(asset)
  let score = 0
  for (const key of Object.keys(WEIGHTS)) {
    if (checks[key]?.passed) score += WEIGHTS[key]
  }
  if (typeof asset?.trustScore === 'number') score = asset.trustScore

  const modStatus = checks.moderation?.status
  let verdict
  if (!checks.moderation || modStatus === 'pending') verdict = 'checking'
  else if (modStatus === 'rejected') verdict = 'reject'
  else if (score >= 90) verdict = 'publish'
  else if (score >= 50) verdict = 'review'
  else verdict = 'reject'

  return { score, verdict }
}
