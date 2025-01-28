
const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new UserRepository();
