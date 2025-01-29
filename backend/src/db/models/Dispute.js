
const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true,
    index: true 
  },
  initiator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  moderator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved'], 
    default: 'pending',
    index: true 
  },
  resolution: { 
    type: String, 
    enum: ['refund', 'release'], 
    default: null 
  },
  resolvedAt: { type: Date },
  evidence: [{ type: String }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});

// Создание составного индекса для часто используемых запросов
DisputeSchema.index({ status: 1, createdAt: -1 });

DisputeSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved') {
    this.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Dispute', DisputeSchema);
