const { createOrder, getOrderById, updateOrderStatus } = require('../db/repositories/OrderRepository');
const WalletService = require('./walletService');
const EscrowService = require('./escrowService');
const mongoose = require('mongoose');
const logger = require('../services/loggingService');

class P2PService {
  static async createOrder(userId, orderData) {
    if (!orderData.amount || orderData.amount <= 0) {
      throw new Error('Invalid order amount');
    }

    const balance = await WalletService.getBalance(userId);
    if (balance < orderData.amount) {
      throw new Error('Insufficient balance');
    }

    const existingOrder = await getOrderById({ userId, status: 'pending' });
    if (existingOrder) {
      throw new Error('User already has a pending order');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await createOrder(userId, orderData, session);
      await EscrowService.lockFunds(userId, order.id, orderData.amount, session);
      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Error creating order: ${error.message}`);
      throw error;
    }
  }

  static async acceptOrder(userId, orderId) {
    const order = await getOrderById(orderId);
    if (!order || order.status !== 'pending') {
      throw new Error('Order not found or not available');
    }

    const balance = await WalletService.getBalance(userId);
    if (balance < order.amount) {
      throw new Error('Insufficient balance to accept order');
    }

    await updateOrderStatus(orderId, 'in_progress');
    return order;
  }

  static async cancelOrder(userId, orderId) {
    const order = await getOrderById(orderId);
    if (!order || order.userId !== userId) {
      throw new Error('Order not found or unauthorized');
    }
    if (order.status === 'in_progress') {
      throw new Error('Cannot cancel order that is in progress');
    }

    await EscrowService.releaseFunds(userId, orderId, order.amount);
    await updateOrderStatus(orderId, 'cancelled');
    return order;
  }
}

module.exports = P2PService;
