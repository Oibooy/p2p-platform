// core/services/P2PService.js
const { createOrder, getOrderById, updateOrderStatus } = require('../db/repositories/OrderRepository');
const WalletService = require('./walletService');
const EscrowService = require('./escrowService');

class P2PService {
  static async createOrder(userId, orderData) {
    if (!orderData.amount || orderData.amount <= 0) {
      throw new Error('Invalid order amount');
    }
    
    const balance = await WalletService.getBalance(userId);
    if (balance < orderData.amount) {
      throw new Error('Insufficient balance');
    }
    
    const order = await createOrder(userId, orderData);
    await EscrowService.lockFunds(userId, order.id, orderData.amount);
    return order;
  }

  static async acceptOrder(userId, orderId) {
    const order = await getOrderById(orderId);
    if (!order || order.status !== 'pending') {
      throw new Error('Order not found or not available');
    }
    
    await updateOrderStatus(orderId, 'in_progress');
    return order;
  }

  static async cancelOrder(userId, orderId) {
    const order = await getOrderById(orderId);
    if (!order || order.userId !== userId) {
      throw new Error('Order not found or unauthorized');
    }
    
    await EscrowService.releaseFunds(userId, orderId, order.amount);
    await updateOrderStatus(orderId, 'cancelled');
    return order;
  }
}

module.exports = P2PService;
