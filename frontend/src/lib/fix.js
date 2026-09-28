// Preview of the Cloudinary transformation the backend's /fix route will apply.
export function buildFixUrl(url, checks, rules) {
  if (!url || !rules || !url.includes('/upload/')) return null

  const parts = []
  const steps = []
  let newFormat = null

  if (checks?.dimensions && !checks.dimensions.passed) {
    parts.push(`c_fill,w_${rules.minWidth},h_${rules.minHeight}`)
    steps.push(`Resize to fill ${rules.minWidth}×${rules.minHeight}px`)
  }
  if (checks?.format && !checks.format.passed && rules.allowedFormats?.length) {
    newFormat = rules.allowedFormats[0].toLowerCase()
    parts.push(`f_${newFormat}`)
    steps.push(`Convert to ${newFormat.toUpperCase()}`)
  }
  if (!parts.length) return null

  parts.push('q_auto')
  let out = url.replace('/upload/', `/upload/${parts.join(',')}/`)
  if (newFormat) out = out.replace(/\.[a-z0-9]+(\?.*)?$/i, `.${newFormat}$1`)
  return { url: out, steps }
}
