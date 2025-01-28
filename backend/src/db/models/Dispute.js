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

// Индексы для оптимизации
DisputeSchema.index({ order: 1 });
DisputeSchema.index({ initiator: 1 });
DisputeSchema.index({ status: 1 });

// Создание нового спора
DisputeSchema.statics.createDispute = async function(orderId, initiatorId, reason) {
  return this.create({
    order: orderId,
    initiator: initiatorId,
    reason: reason,
    status: 'pending'
  });
};

// Назначение модератора
DisputeSchema.methods.assignModerator = async function(moderatorId) {
  this.moderator = moderatorId;
  return this.save();
};

// Разрешение спора
DisputeSchema.methods.resolve = async function(resolution) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolvedAt = new Date();
  return this.save();
};

// Получение активных споров
DisputeSchema.statics.getActiveDisputes = async function() {
  return this.find({ status: 'pending' })
    .populate('order')
    .populate('initiator', 'username')
    .populate('moderator', 'username');
};

module.exports = mongoose.model('Dispute', DisputeSchema);

