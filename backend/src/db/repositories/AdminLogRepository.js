
const BaseRepository = require('./BaseRepository');
const AdminLog = require('../models/AdminLog');

class AdminLogRepository extends BaseRepository {
  constructor() {
    super(AdminLog);
  }

  async findByAdmin(adminId, page = 1, limit = 10) {
    return this.findWithPagination({ admin: adminId }, page, limit);
  }

  async findByAction(action, page = 1, limit = 10) {
    return this.findWithPagination({ action }, page, limit);
  }

  async getRecentLogs(limit = 50) {
    return this.model.find()
      .populate('admin', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = AdminLogRepository;
