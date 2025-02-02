// src/core/services/disputeService.js (Рефакторинг + управление спорами)
const { DisputeRepository } = require('../../db/repositories/DisputeRepository');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');

class DisputeService {
    constructor() {
        this.disputeRepository = new DisputeRepository();
        this.orderRepository = new OrderRepository();
    }

    async createDispute(orderId, userId, reason) {
        try {
            logger.info(`Creating dispute for order ${orderId} by user ${userId}`);

            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PAID') throw new Error('Order is not eligible for dispute');

            const dispute = await this.disputeRepository.create({ orderId, userId, reason, status: 'OPEN' });
            metrics.increment('disputes.created');
            return dispute;
        } catch (error) {
            logger.error(`Dispute creation error: ${error.message}`);
            throw error;
        }
    }

    async resolveDispute(disputeId, resolution, adminId) {
        try {
            logger.info(`Resolving dispute ${disputeId} by admin ${adminId}`);

            const dispute = await this.disputeRepository.findById(disputeId);
            if (!dispute) throw new Error('Dispute not found');
            if (dispute.status !== 'OPEN') throw new Error('Dispute is not open');

            await this.disputeRepository.updateStatus(disputeId, 'RESOLVED', resolution, adminId);
            metrics.increment('disputes.resolved');
            return { success: true, resolution };
        } catch (error) {
            logger.error(`Dispute resolution error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DisputeService();
