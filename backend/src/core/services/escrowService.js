const { OrderRepository } = require('../db/repositories/OrderRepository');
const { lockFunds, releaseFunds } = require('../db/repositories/EscrowRepository');
const WalletService = require('./WalletService');
const hotWalletService = require('./HotWalletService');
const logger = require('../infrastructure/logger');
const metrics = require('../infrastructure/metrics');
const mongoose = require('mongoose');
const { BigNumber } = require('ethers');

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 секунды

class EscrowService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async lockFunds(userId, orderId, amount, token) {
        const balance = await WalletService.getBalance(userId, token);
        if (BigNumber.from(balance).lt(BigNumber.from(amount))) {
            throw new Error(`Insufficient ${token} balance to lock funds`);
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await lockFunds(userId, orderId, amount, token, session);
            await session.commitTransaction();
            session.endSession();
            logger.info(`🔒 ${amount} ${token} заблокированы для заказа ${orderId}`);
            return { success: true, message: `Funds locked successfully for ${token}` };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`❌ Ошибка блокировки ${token}: ${error.message}`);
            throw error;
        }
    }

    async releaseFunds(orderId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PAID') throw new Error('Order is not eligible for release');

            logger.info(`🔄 Разблокировка ${order.token} для сделки ${orderId}`);
            metrics.increment('escrow.transactions.releasing');

            const transaction = await hotWalletService.sendToken(order.sellerId, order.amount, order.token);
            if (!transaction) {
                throw new Error(`Failed to release ${order.token} funds`);
            }

            await releaseFunds(order.sellerId, orderId, order.amount, order.token, session);
            await this.orderRepository.updateStatus(orderId, 'COMPLETED', session);

            await session.commitTransaction();
            session.endSession();
            logger.info(`✅ Сделка ${orderId} завершена, средства (${order.token}) отправлены. Tx: ${transaction}`);
            metrics.increment('escrow.transactions.completed');
            return { success: true, txHash: transaction };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`❌ Ошибка при разблокировке ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EscrowService();
