const { findMatchingOrder, createOrder, updateOrderStatus } = require('../db/repositories/OrderRepository');
const WalletService = require('./walletService');
const EscrowService = require('./escrowService');
const logger = require('../infrastructure/logger');

class OrderMatchingService {
  /**
   * 📌 Автоматический подбор встречного ордера
   */
  static async matchOrder(userId, orderData) {
    try {
      if (!orderData.amount || orderData.amount <= 0) {
        throw new Error('Invalid order amount');
      }

      const balance = await WalletService.getBalance(userId);
      if (balance < orderData.amount) {
        throw new Error('Insufficient balance');
      }

      // Поиск встречного ордера
      const match = await findMatchingOrder(orderData);

      if (match) {
        logger.info(`✅ Найден встречный ордер: ${match.id}`);

        await EscrowService.lockFunds(userId, match.id, orderData.amount);
        await EscrowService.lockFunds(match.userId, match.id, match.amount);

        await updateOrderStatus(match.id, 'matched');
        return match;
      }

      // Если встречного ордера нет, создаём новый
      const newOrder = await createOrder(userId, orderData);
      await EscrowService.lockFunds(userId, newOrder.id, orderData.amount);
      logger.info(`🆕 Создан новый ордер: ${newOrder.id}`);

      return newOrder;
    } catch (error) {
      logger.error(`❌ Ошибка подбора ордера: ${error.message}`);
      throw error;
    }
  }
}

module.exports = OrderMatchingService;
