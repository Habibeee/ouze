// src/models/TokenBlacklist.js
const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, index: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ['user', 'translataire', 'admin'], required: true },
  expiresAt: { type: Date, required: true, index: true }
});

// TTL index to auto-remove expired entries
// Note: Alternatively, ensure an index with { expireAfterSeconds: 0 } is created on expiresAt
// Here we rely on the field index and model usage; ensure Mongo creates TTL index in production.
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
