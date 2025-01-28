
const Order = require('../models/Order');

class OrderRepository {
  async findById(id) {
    return Order.findById(id).populate('seller buyer');
  }

  async create(orderData) {
    return Order.create(orderData);
  }

  async findByUser(userId) {
    return Order.find({
      $or: [{ seller: userId }, { buyer: userId }]
    }).populate('seller buyer');
  }
}

module.exports = new OrderRepository();
