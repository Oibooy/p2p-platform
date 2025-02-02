// src/core/services/escrowService.js (Рефакторинг + улучшения безопасности + мониторинг транзакций)
const tronWeb = require('../../infrastructure/tronWeb');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics'); // Подключение системы мониторинга
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 секунды

class EscrowService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async initiateTransaction(orderId, sender, receiver, amount) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PENDING') throw new Error('Order is not in a valid state');

            logger.info(`Initiating escrow transaction for order ${orderId}`);
            metrics.increment('escrow.transactions.initiated'); // Логирование метрики

            const transaction = await this.retryAsync(() => tronWeb.sendTransaction(receiver, amount, sender), MAX_RETRIES);
            if (!transaction || !transaction.txID) {
                throw new Error('Transaction failed');
            }

            await this.orderRepository.updateStatus(orderId, 'IN_PROGRESS', transaction.txID);
            metrics.increment('escrow.transactions.success'); // Логирование успешных транзакций
            return transaction;
        } catch (error) {
            logger.error(`EscrowService Error: ${error.message}`);
            metrics.increment('escrow.transactions.failed'); // Логирование неудачных транзакций
            throw error;
        }
    }

    async confirmTransaction(orderId, txID) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'IN_PROGRESS') throw new Error('Order is not in progress');

            const receipt = await this.retryAsync(() => tronWeb.getTransactionReceipt(txID), MAX_RETRIES);
            if (!receipt || receipt.status !== 'SUCCESS') {
                throw new Error('Transaction not confirmed');
            }

            await this.orderRepository.updateStatus(orderId, 'COMPLETED');
            metrics.increment('escrow.transactions.confirmed'); // Логирование подтвержденных транзакций
            return { success: true };
        } catch (error) {
            logger.error(`Transaction Confirmation Error: ${error.message}`);
            metrics.increment('escrow.transactions.confirmation_failed'); // Логирование ошибок подтверждения
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
                logger.warn(`Retrying transaction... Attempt ${attempt}/${retries}`);
                metrics.increment('escrow.transactions.retries'); // Логирование попыток повторных транзакций
                if (attempt >= retries) throw error;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
}

module.exports = new EscrowService();

// src/services/escrowService.js
const { sendUSDT } = require('./hotWalletService');
const { OrderRepository } = require('../db/repositories/OrderRepository');
const logger = require('../services/loggingService');

class EscrowService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    /**
     * 📌 Обрабатывает завершение сделки и отправляет USDT через горячий кошелек
     */
    async releaseFunds(orderId) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('❌ Заказ не найден');
            if (order.status !== 'PAID') throw new Error('❌ Заказ не оплачен');

            logger.info(`🔄 Разблокировка средств для сделки ${orderId}`);

            // Отправка USDT с горячего кошелька продавцу
            const transaction = await sendUSDT(order.sellerId, order.amount);
            await this.orderRepository.updateStatus(orderId, 'COMPLETED');

            logger.info(`✅ Сделка ${orderId} завершена, средства отправлены продавцу.`);
            return transaction;
        } catch (error) {
            logger.logError(`❌ Ошибка при разблокировке средств: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EscrowService();