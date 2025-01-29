
const BaseRepository = require('./BaseRepository');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByUser(userId) {
    return this.find({
      $or: [{ user: userId }]
    }).populate('user');
  }

  async updateOrderStatus(orderId, status, userId = null) {
    const updateData = { status };
    if (userId) {
      updateData.lastModifiedBy = userId;
    }
    return this.findOneAndUpdate(
      { _id: orderId },
      { $set: updateData },
      { new: true }
    );
  }

  async findActiveOrders() {
    return this.find({
      status: 'open',
      expiresAt: { $gt: new Date() }
    }).populate('user');
  }
}

module.exports = new OrderRepository();
