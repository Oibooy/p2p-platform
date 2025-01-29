
const BaseRepository = require('./BaseRepository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async getUserUnreadNotifications(userId) {
    return this.find({ 
      user: userId,
      isRead: false 
    }).sort({ createdAt: -1 });
  }

  async markAllAsRead(userId) {
    return this.model.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  async getRecentNotifications(userId, limit = 10) {
    return this.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new NotificationRepository();
