const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'refunded', 'disputed', 'expired', 'cancelled'], //Added 'active' and 'cancelled'
      default: 'pending',
    },
    deadline: {
      type: Date,
      required: true,
    },
    smartContractId: {
      type: String, required: false },
    screenshot: { type: String, required: false }, 
    history: [
      {
        status: {
          type: String,
          enum: ['pending', 'active', 'completed', 'refunded', 'disputed', 'expired', 'cancelled'], //Added 'active' and 'cancelled'
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    completedAt: { type: Date },
    disputeReason: { type: String },
    chatEnabled: { type: Boolean, default: true }
  },
  {
    timestamps: true, 
  }
);

dealSchema.index({ buyer: 1 });
dealSchema.index({ seller: 1 });
dealSchema.index({ status: 1 });
dealSchema.index({ deadline: 1 });


dealSchema.methods.addStatusToHistory = async function (newStatus) {
  const validTransitions = {
    pending: ['active', 'expired'], //updated
    active: ['completed', 'refunded', 'disputed', 'cancelled'], //added
    completed: [],
    refunded: [],
    disputed: ['resolved'],
    expired: [],
    cancelled: [] //added
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Нельзя перейти из статуса ${this.status} в ${newStatus}`);
  }

  this.history.push({ status: newStatus });
  this.status = newStatus;
  await this.save();
};

dealSchema.methods.checkAndExpire = async function () {
  if (this.isExpired()) {
    await this.updateStatus('expired');
  }
};

dealSchema.methods.isExpired = function () {
  return Date.now() > new Date(this.deadline).getTime();
};

dealSchema.statics.getDealDetails = async function (dealId) {
  return this.findById(dealId).populate('buyer', 'username').populate('seller', 'username');
};

dealSchema.statics.createDeal = async function (buyerId, sellerId, amount, deadline) {
  return this.create({
    buyer: buyerId,
    seller: sellerId,
    amount: amount,
    deadline: deadline,
    status: 'pending'
  });
};

dealSchema.statics.getUserActiveDeals = async function (userId) {
  return this.find({
    $or: [{ buyer: userId }, { seller: userId }],
    status: { $in: ['pending', 'active', 'disputed'] } //updated
  }).populate('buyer seller', 'username');
};

dealSchema.methods.updateStatus = async function (newStatus) {
  if (this.status === newStatus) return this;

  await this.addStatusToHistory(newStatus);
  return this;
};

dealSchema.methods.canPerformAction = function (action, userId) {
  const actions = {
    fund: () => this.status === 'pending' && this.buyer.toString() === userId.toString(),
    complete: () => this.status === 'active' && this.seller.toString() === userId.toString(), //updated
    dispute: () => this.status === 'active' && 
      (this.buyer.toString() === userId.toString() || this.seller.toString() === userId.toString()), //updated
    cancel: () => this.status === 'pending' && (this.buyer.toString() === userId.toString() || this.seller.toString() === userId.toString()) //added
  };

  return actions[action] ? actions[action]() : false;
};

dealSchema.methods.activate = async function() {
  await this.updateStatus('active');
  return this;
};

dealSchema.methods.complete = async function() {
  await this.updateStatus('completed');
  this.completedAt = new Date();
  return this.save();
};

dealSchema.methods.dispute = async function(reason) {
  this.disputeReason = reason;
  await this.updateStatus('disputed');
  return this;
};

dealSchema.methods.cancel = async function() {
  await this.updateStatus('cancelled');
  return this;
};

module.exports = mongoose.model('Deal', dealSchema);