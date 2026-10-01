# Content Firewall

**Team EthicalOne — HackIndia: Pixels to Products, Cloudinary AI Hackathon 2026**
**Track 1 — AI Media Pipelines**

Content Firewall checks brand media against a set of rules before it goes live. Every
image is uploaded, run through Cloudinary's AI moderation and metadata APIs, scored
against brand rules, and either cleared for publish, held for human review, or blocked —
with a reason attached and a full audit trail.

## The problem

Marketing and social teams publish a high volume of images every week. Mistakes slip
through manually: an unsafe image, a banner that's too small for the platform, a file in
the wrong format, an asset that doesn't match brand colors. By the time someone notices,
it's already live. Content Firewall catches these issues automatically, before
publication, instead of after.

## How Cloudinary is used

Cloudinary is the core of the pipeline, not just storage:

- **Upload widget** — the browser uploads the file directly to Cloudinary using an
  unsigned upload preset, so the original file never passes through our server.
- **AWS Rekognition Moderation add-on** — every upload is screened for unsafe content.
  A flagged image is blocked outright, regardless of its score on the other checks.
- **Admin API (`getFullAssetDetails`)** — after upload, the backend calls Cloudinary's
  Admin API with `colors: true` and `image_metadata: true` to pull dominant colors,
  dimensions, and format for the asset.
- **Transformation URLs** — when an asset fails on resolution or format, the app builds
  a Cloudinary transformation URL (`c_fill,w_,h_`, `f_`) that resizes and re-encodes the
  image on the fly, and shows a before/after preview without re-uploading anything.

## What gets checked

Each asset is run through four checks, combined into a single **Brand Trust Score**
(0–100):

| Check | What it verifies | Weight |
|---|---|---|
| Safety | Passed Cloudinary's moderation screen | 40 |
| Brand color | A dominant color is within tolerance of the brand palette | 20 |
| Resolution | Meets the minimum width/height set in the brand rules | 20 |
| File format | Format is in the allowed list | 20 |

A failed safety check blocks the asset outright, no matter the score. Otherwise:
**90+** is cleared to publish, **50–89** goes to manual review, and anything lower is
blocked.

## How it works

1. **Upload** — a reviewer drops an image into the app; it uploads straight to
   Cloudinary via an unsigned preset.
2. **Register** — the browser sends Cloudinary's returned `public_id` to the backend.
3. **Evaluate** — the backend fetches full asset details from Cloudinary and runs the
   rule engine against the active brand rule set, saving the result and logging it.
4. **Decide** — the dashboard shows every asset with its score and status. A reviewer
   can open any asset to see exactly which checks failed and why, apply an automatic
   fix for resolution/format issues, and approve or reject with a note.
5. **Audit** — every action (upload, check, fix, approval, rejection) is written to an
   audit log so the full history of an asset is always available.

## Tech stack

- **Frontend:** React (Vite), plain CSS, axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **Media & AI:** Cloudinary (Upload API, Admin API, AWS Rekognition Moderation
  add-on, transformation URLs)

## Project structure

```
backend/
  src/
    config/db.js              MongoDB connection
    models/                   Asset, BrandRuleConfig, AuditLog
    routes/                   assets.js, rules.js
    services/                 cloudinaryService.js, ruleEngine.js
    server.js
frontend/
  src/
    api/                      axios client + asset API calls
    components/                UploadPanel, AssetDashboard, AssetCard, AssetDetail,
                               FixPreview, AuditTrailView, TrustRing
    lib/                      trustScore.js, fix.js
    App.jsx
```

## Setup

### Prerequisites

- Node.js (LTS)
- A MongoDB Atlas cluster (free tier is enough)
- A Cloudinary account with:
  - the **AWS Rekognition Moderation** add-on enabled (free plan)
  - an **unsigned upload preset** with moderation set to AWS Rekognition Moderation

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

`backend/.env`:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=
MONGODB_URI=
PORT=5000
```

Confirm it's running: `http://localhost:5000/health` should return `{"status":"ok"}`.

Seed a brand rule set (the app needs at least one to evaluate uploads against):

```bash
curl -X POST http://localhost:5000/api/rules \
  -H "Content-Type: application/json" \
  -d '{"name":"Default Rules","minWidth":1200,"minHeight":630,"allowedFormats":["jpg","png"],"brandColors":["#0c6b58","#ffffff"],"colorTolerance":40}'
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_USE_MOCK=false
```

Open `http://localhost:5173`. Setting `VITE_USE_MOCK=true` runs the full UI on
built-in demo data with no backend or Cloudinary keys required — useful for a quick
look without any setup.

## Live demo

- App: _add the deployed frontend link here_
- API: _add the deployed backend link here_
- Video walkthrough: _add the demo video link here_

## Known limitations

- Only one active brand rule set at a time; there's no in-app way to create or switch
  between rule sets yet (it's seeded via a single API call, see Setup above).
- No authentication — anyone with the link can review and decide on assets. Fine for
  a hackathon demo, not meant for production use as-is.
- Moderation confidence scores from Cloudinary aren't surfaced in the UI yet, only the
  pass/fail result and the flagged category.

## What's next

- **Rule editor UI** — create and switch between brand rule sets from the app instead
  of a one-time API call.
- **Brand-topic matching** — use Cloudinary's auto-tagging to flag content that's
  off-topic for the brand (e.g. a food photo uploaded for a fashion account), not just
  unsafe or off-spec.
- **Analytics panel** — pass rate, average trust score, and the most common failure
  reasons across all reviewed assets.
- **Bulk review** — select and clear or deny multiple "on hold" assets at once.
- **Exportable audit report** — download the case history as a CSV/PDF for compliance
  records.

## Team — EthicalOne

- Sarthak Hire — backend (data models, Cloudinary service, rule engine, API routes)
- Adarsh — frontend (dashboard, trust score, review flow, audit trail, design)