// src/core/services/paymentService.js (Рефакторинг + безопасность транзакций)
const tronWeb = require('../../infrastructure/tronWeb');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 секунды

class PaymentService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async processPayment(orderId, sender, receiver, amount) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PENDING') throw new Error('Order is not in a valid state');
            
            logger.info(`Processing payment for order ${orderId}`);
            metrics.increment('payments.initiated');
            
            const transaction = await this.retryAsync(() => tronWeb.sendTransaction(receiver, amount, sender), MAX_RETRIES);
            if (!transaction || !transaction.txID) {
                throw new Error('Payment failed');
            }
            
            await this.orderRepository.updateStatus(orderId, 'PAID', transaction.txID);
            metrics.increment('payments.success');
            return transaction;
        } catch (error) {
            logger.error(`PaymentService Error: ${error.message}`);
            metrics.increment('payments.failed');
            throw error;
        }
    }

    async confirmPayment(orderId, txID) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PAID') throw new Error('Order is not marked as paid');
            
            const receipt = await this.retryAsync(() => tronWeb.getTransactionReceipt(txID), MAX_RETRIES);
            if (!receipt || receipt.status !== 'SUCCESS') {
                throw new Error('Payment not confirmed');
            }
            
            await this.orderRepository.updateStatus(orderId, 'COMPLETED');
            metrics.increment('payments.confirmed');
            return { success: true };
        } catch (error) {
            logger.error(`Payment Confirmation Error: ${error.message}`);
            metrics.increment('payments.confirmation_failed');
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
                logger.warn(`Retrying payment... Attempt ${attempt}/${retries}`);
                metrics.increment('payments.retries');
                if (attempt >= retries) throw error;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
}

module.exports = new PaymentService();