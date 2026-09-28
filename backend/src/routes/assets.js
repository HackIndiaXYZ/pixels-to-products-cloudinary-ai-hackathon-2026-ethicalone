const express = require('express');
const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');
const BrandRuleConfig = require('../models/BrandRuleConfig');
const { getFullAssetDetails } = require('../services/cloudinaryService');
const { evaluateAsset } = require('../services/ruleEngine');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

async function logAudit(assetId, action, details) {
  await AuditLog.create({ assetId, action, details });
}

// Uses the first rule config in the database. Creates a default one if none exists.
async function getRuleConfig() {
  let config = await BrandRuleConfig.findOne().sort({ _id: 1 });
  if (!config) {
    config = await BrandRuleConfig.create({
      name: 'Default Rules',
      minWidth: 1200,
      minHeight: 630,
      allowedFormats: ['jpg', 'png'],
      brandColors: ['#0c6b58', '#ffffff'],
      colorTolerance: 40
    });
  }
  return config;
}

function summarize(checks) {
  const results = Object.values(checks);
  const passedCount = results.filter((c) => c.passed).length;
  return `${passedCount} of ${results.length} checks passed`;
}

// Register a freshly uploaded asset: fetch details, run checks, save.
router.post('/', asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' });
  }

  const details = await getFullAssetDetails(publicId);
  const ruleConfig = await getRuleConfig();
  const checks = evaluateAsset(details, ruleConfig);

  const asset = await Asset.create({
    cloudinaryPublicId: details.public_id,
    originalUrl: details.secure_url,
    checks
  });

  await logAudit(asset._id, 'uploaded', `Asset ${details.public_id} registered`);
  await logAudit(asset._id, 'checked', summarize(checks));

  res.status(201).json(asset);
}));

// List all assets, newest first.
router.get('/', asyncHandler(async (req, res) => {
  const assets = await Asset.find().sort({ uploadedAt: -1 });
  res.json(assets);
}));

// Get one asset.
router.get('/:id', asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
}));

// Re-run all checks against Cloudinary and the current rules.
// Needed because moderation is often still "pending" right after upload.
router.post('/:id/recheck', asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const details = await getFullAssetDetails(asset.cloudinaryPublicId);
  const ruleConfig = await getRuleConfig();
  const checks = evaluateAsset(details, ruleConfig);

  asset.checks = checks;
  await asset.save();
  await logAudit(asset._id, 'rechecked', summarize(checks));

  res.json(asset);
}));

// Auto-fix: build a corrected delivery URL for dimension and format failures.
router.post('/:id/fix', asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const ruleConfig = await getRuleConfig();
  const steps = [];

  if (!asset.checks.dimensions.passed) {
    // c_fill resizes and crops to the exact target size
    steps.push(`c_fill,w_${ruleConfig.minWidth},h_${ruleConfig.minHeight}`);
  }
  if (!asset.checks.format.passed) {
    // Force the first allowed format. f_auto would pick per browser and could
    // deliver a format that is not on the allowed list.
    steps.push(`f_${ruleConfig.allowedFormats[0]}`);
  }

  if (steps.length === 0) {
    return res.status(400).json({
      error: 'Nothing to auto-fix. Only dimension and format failures can be fixed by transformation.'
    });
  }

  steps.push('q_auto');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  asset.fixedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${steps.join('/')}/${asset.cloudinaryPublicId}`;
  asset.fixApplied = true;
  await asset.save();
  await logAudit(asset._id, 'fixed', `Applied transformation: ${steps.join(' / ')}`);

  res.json(asset);
}));

// Approve or reject.
router.post('/:id/decision', asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
  }

  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (decision === 'approved' && !asset.checks.moderation.passed) {
    return res.status(400).json({ error: 'Assets that have not passed moderation cannot be approved' });
  }

  asset.decision = decision;
  asset.decisionNote = note || '';
  asset.decidedAt = new Date();
  await asset.save();
  await logAudit(asset._id, decision, note || 'No note provided');

  res.json(asset);
}));

// Audit history for one asset, oldest first.
router.get('/:id/audit', asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ assetId: req.params.id }).sort({ timestamp: 1 });
  res.json(logs);
}));

module.exports = router;