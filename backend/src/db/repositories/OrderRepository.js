
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

  async findActiveOrders() {
    return this.find({
      status: 'open',
      expiresAt: { $gt: new Date() }
    }).populate('user');
  }
}

module.exports = new OrderRepository();
