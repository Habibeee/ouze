const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  translataireId: { type: mongoose.Schema.Types.ObjectId, ref: 'Translataire', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  attachments: [{ type: String }],
  isApproved: { type: Boolean, default: true, index: true }
}, { timestamps: true });

reviewSchema.index({ translataireId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
