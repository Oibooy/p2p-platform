
const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async updateRole(userId, roleId) {
    return this.update(userId, { role: roleId });
  }

  async getActiveUsers() {
    return this.find({ isActive: true });
  }
}

module.exports = new UserRepository();
