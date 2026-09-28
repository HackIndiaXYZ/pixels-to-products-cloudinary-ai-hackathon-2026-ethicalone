const express = require('express');
const BrandRuleConfig = require('../models/BrandRuleConfig');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const configs = await BrandRuleConfig.find();
  res.json(configs);
}));

// Create a rule config, or update the one with the same name.
router.post('/', asyncHandler(async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const config = await BrandRuleConfig.findOneAndUpdate(
    { name: req.body.name },
    req.body,
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(config);
}));

module.exports = router;