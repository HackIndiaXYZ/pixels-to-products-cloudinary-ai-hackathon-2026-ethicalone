// API functions for the dashboard. Uses the shared axios instance from ./client.js.
// Set VITE_USE_MOCK=true in frontend/.env to run the dashboard on demo data (no backend needed).
import client from './client'
import { buildFixUrl } from '../lib/fix'

export const isMock = import.meta.env.VITE_USE_MOCK === 'true'
export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong'

const real = {
  async getRules() {
    const { data } = await client.get('/api/rules')
    return Array.isArray(data) ? data[0] || null : data
  },
  async listAssets() {
    const { data } = await client.get('/api/assets')
    return data
  },
  async recheck(id) {
    const { data } = await client.post(`/api/assets/${id}/recheck`)
    return data
  },
  async decide(id, decision, note) {
    const { data } = await client.post(`/api/assets/${id}/decision`, { decision, note })
    return data
  },
  async applyFix(id) {
    const { data } = await client.post(`/api/assets/${id}/fix`)
    return data
  },
  async getAudit(id) {
    const { data } = await client.get(`/api/assets/${id}/audit`)
    return data
  },
}

/* ---------------- demo data ---------------- */
const RULES = {
  name: 'Default Rules',
  minWidth: 1200,
  minHeight: 630,
  allowedFormats: ['jpg', 'png'],
  brandColors: ['#0c6b58', '#ffffff'],
  colorTolerance: 40,
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))
const nowIso = () => new Date().toISOString()

function check(passed, reason, extra = {}) {
  return { passed, reason: passed ? '' : reason, ...extra }
}
function seedAsset(n, id, file, m) {
  return {
    _id: id,
    cloudinaryPublicId: `demo/${m.name}`,
    originalUrl: `https://res.cloudinary.com/demo/image/upload/${file}`,
    uploadedAt: new Date(Date.now() - n * 3600e3).toISOString(),
    checks: {
      moderation: check(m.mod === 'approved', `Flagged by moderation: ${m.label || 'Violence'}`, { status: m.mod }),
      dimensions: check(m.w >= RULES.minWidth && m.h >= RULES.minHeight, `Resolution ${m.w}x${m.h} is below minimum ${RULES.minWidth}x${RULES.minHeight}`, { width: m.w, height: m.h }),
      format: check(RULES.allowedFormats.includes(m.fmt), `Format "${m.fmt}" is not allowed (allowed: ${RULES.allowedFormats.join(', ')})`, { value: m.fmt }),
      brandColor: check(m.colorOk, 'No dominant color is close to the brand palette (closest distance 180, allowed 40)', { dominantColors: m.colors }),
    },
    fixApplied: false,
    decision: 'pending',
  }
}

let assets = [
  seedAsset(1, 'a1', 'sample.jpg', { name: 'summer-hero', mod: 'approved', w: 2000, h: 1333, fmt: 'jpg', colorOk: true, colors: ['#0d6b59', '#f1f1ec', '#222222'] }),
  seedAsset(2, 'a2', 'cld-sample-2.jpg', { name: 'campaign-banner', mod: 'approved', w: 640, h: 480, fmt: 'jpg', colorOk: true, colors: ['#0f6c5a', '#ededed', '#333333'] }),
  seedAsset(3, 'a3', 'cld-sample-3.jpg', { name: 'product-shot', mod: 'approved', w: 1400, h: 1400, fmt: 'gif', colorOk: true, colors: ['#0b6a57', '#f4f4f0', '#111111'] }),
  seedAsset(4, 'a4', 'cld-sample-4.jpg', { name: 'unsafe-upload', mod: 'rejected', w: 1600, h: 1200, fmt: 'jpg', colorOk: true, colors: ['#0c6b58', '#f2f2ee', '#000000'] }),
  seedAsset(5, 'a5', 'cld-sample-5.jpg', { name: 'off-brand-poster', mod: 'approved', w: 800, h: 600, fmt: 'gif', colorOk: false, colors: ['#e4572e', '#ffc914', '#17bea8'] }),
]
let audit = assets.flatMap((a) => [
  { assetId: a._id, action: 'uploaded', details: `Asset ${a.cloudinaryPublicId} registered`, timestamp: a.uploadedAt },
  { assetId: a._id, action: 'checked', details: 'Checks completed', timestamp: a.uploadedAt },
])
const log = (assetId, action, details) => audit.push({ assetId, action, details, timestamp: nowIso() })
const find = (id) => {
  const a = assets.find((x) => x._id === id)
  if (!a) throw new Error('Asset not found')
  return a
}

const mock = {
  async getRules() { await sleep(150); return clone(RULES) },
  async listAssets() { await sleep(250); return clone(assets) },
  async recheck(id) { await sleep(400); log(id, 'rechecked', 'Checks re-run'); return clone(find(id)) },
  async decide(id, decision, note) {
    await sleep(250)
    const a = find(id)
    if (decision === 'approved' && !a.checks.moderation.passed) {
      const e = new Error('Assets that have not passed moderation cannot be approved')
      throw e
    }
    Object.assign(a, { decision, decisionNote: note || '', decidedAt: nowIso() })
    log(id, decision, note || 'No note provided')
    return clone(a)
  },
  async applyFix(id) {
    await sleep(500)
    const a = find(id)
    const fix = buildFixUrl(a.originalUrl, a.checks, RULES)
    if (!fix) throw new Error('Nothing to auto-fix.')
    Object.assign(a, { fixApplied: true, fixedUrl: fix.url })
    log(id, 'fixed', `Applied transformation: ${fix.steps.join(' / ')}`)
    return clone(a)
  },
  async getAudit(id) { await sleep(150); return clone(audit.filter((l) => l.assetId === id)) },
}

export const api = isMock ? mock : real
