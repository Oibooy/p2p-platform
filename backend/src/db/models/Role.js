
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['user', 'moderator', 'admin']
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

// Индексы
roleSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
