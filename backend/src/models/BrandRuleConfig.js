const mongoose = require('mongoose');

const BrandRuleConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minWidth: Number,
  minHeight: Number,
  allowedFormats: [String],
  brandColors: [String],
  colorTolerance: { type: Number, default: 40 }
});

module.exports = mongoose.model('BrandRuleConfig', BrandRuleConfigSchema);