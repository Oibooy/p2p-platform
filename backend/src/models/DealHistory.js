
const mongoose = require('mongoose');

const dealHistorySchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'funded', 'released', 'refunded', 'disputed'],
    required: true
  },
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Object
  }
});

module.exports = mongoose.model('DealHistory', dealHistorySchema);
