const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  resolution: { type: String, enum: ['refund', 'release'], default: null },
  resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', DisputeSchema);

