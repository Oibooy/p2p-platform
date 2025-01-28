
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['user', 'moderator', 'admin']
  },
  permissions: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
