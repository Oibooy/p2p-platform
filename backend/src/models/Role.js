const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Название роли должно быть уникальным
    enum: ['user', 'moderator', 'admin'], // Допустимые роли
  },
});

module.exports = mongoose.model('Role', roleSchema);
