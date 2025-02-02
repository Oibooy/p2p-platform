// core/services/EscrowService.js
const { OrderRepository } = require('../db/repositories/OrderRepository');
const { lockFunds, releaseFunds } = require('../db/repositories/EscrowRepository');
const WalletService = require('./WalletService');
const hotWalletService = require('./HotWalletService');
const logger = require('../infrastructure/logger');
const metrics = require('../infrastructure/metrics');

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 секунды

class EscrowService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async lockFunds(userId, orderId, amount, token) {
        const balance = await WalletService.getBalance(userId, token);
        if (balance < amount) {
            throw new Error(`Insufficient ${token} balance to lock funds`);
        }

        await lockFunds(userId, orderId, amount, token);
        logger.info(`🔒 Средства на сумму ${amount} ${token} заблокированы для заказа ${orderId}`);
        return { success: true, message: `Funds locked successfully for ${token}` };
    }

    async releaseFunds(orderId) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PAID') throw new Error('Order is not eligible for release');

            logger.info(`🔄 Разблокировка средств (${order.token}) для сделки ${orderId}`);
            metrics.increment('escrow.transactions.releasing');

            // Определяем, какой токен отправлять (USDT или MTT)
            const transaction = await this.retryAsync(() => hotWalletService.sendToken(order.sellerId, order.amount, order.token), MAX_RETRIES);
            if (!transaction) {
                throw new Error(`Failed to release ${order.token} funds`);
            }

            await releaseFunds(order.sellerId, orderId, order.amount, order.token);
            await this.orderRepository.updateStatus(orderId, 'COMPLETED');

            logger.info(`✅ Сделка ${orderId} завершена, средства (${order.token}) отправлены продавцу.`);
            metrics.increment('escrow.transactions.completed');
            return transaction;
        } catch (error) {
            logger.error(`❌ Ошибка при разблокировке ${order.token} средств: ${error.message}`);
            metrics.increment('escrow.transactions.failed');
            throw error;
        }
    }

    async retryAsync(fn, retries) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                logger.warn(`🔁 Повторная попытка ${attempt}/${retries}`);
                metrics.increment('escrow.transactions.retries');
                if (attempt >= retries) throw error;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
}

module.exports = new EscrowService();
