const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  cloudinaryPublicId: { type: String, required: true },
  originalUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },

  checks: {
    moderation: {
      status: String,
      passed: Boolean,
      reason: String
    },
    dimensions: {
      width: Number,
      height: Number,
      passed: Boolean,
      reason: String
    },
    format: {
      value: String,
      passed: Boolean,
      reason: String
    },
    brandColor: {
      dominantColors: [String],
      passed: Boolean,
      reason: String
    }
  },

  fixApplied: { type: Boolean, default: false },
  fixedUrl: String,

  decision: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  decisionNote: String,
  decidedAt: Date
});

module.exports = mongoose.model('Asset', AssetSchema);