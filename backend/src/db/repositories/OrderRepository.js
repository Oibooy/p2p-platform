const BaseRepository = require('./BaseRepository');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const logger = require('../services/loggingService');

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
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (userId && !order.user.equals(userId) && !userId.isAdmin) {
      throw new Error('Unauthorized to update order status');
    }

    if (order.status === status) {
      return order;
    }

    const updateData = { status, updatedAt: new Date() };
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
    }).populate('user').sort({ expiresAt: 1 }).lean();
  }

  async updateStatus(orderId, status, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      if (userId && !order.user.equals(userId) && !userId.isAdmin) {
        throw new Error('Unauthorized to update order status');
      }
      if (order.status === status) {
        return order;
      }
      const updatedOrder = await this.findOneAndUpdate(
        { _id: orderId },
        { 
          $set: { 
            status,
            lastModifiedBy: userId,
            updatedAt: new Date()
          }
        },
        { new: true, session }
      ).populate('user');
      await session.commitTransaction();
      session.endSession();
      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Failed to update order status: ${error.message}`);
      throw error;
    }
  }
}

// Добавляем индекс для ускорения поиска активных заказов
Order.collection.createIndex({ status: 1, expiresAt: 1 });

module.exports = new OrderRepository();
