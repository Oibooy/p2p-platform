const { DisputeRepository } = require('../../db/repositories/DisputeRepository');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');
const mongoose = require('mongoose');

class DisputeService {
    constructor() {
        this.disputeRepository = new DisputeRepository();
        this.orderRepository = new OrderRepository();
    }

    async createDispute(orderId, userId, reason) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            logger.info(`Creating dispute for order ${orderId} by user ${userId}`);

            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'PAID') throw new Error('Order is not eligible for dispute');

            const existingDispute = await this.disputeRepository.findOne({ orderId, userId });
            if (existingDispute) throw new Error('Dispute already exists for this order');

            const now = new Date();
            const orderDate = new Date(order.updatedAt);
            const diffHours = Math.abs(now - orderDate) / 36e5;
            if (diffHours > 24) throw new Error('Dispute period has expired');

            const dispute = await this.disputeRepository.create({ orderId, userId, reason, status: 'OPEN' }, session);
            metrics.increment('disputes.created');

            await session.commitTransaction();
            session.endSession();
            return dispute;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Dispute creation error: ${error.message}`);
            throw error;
        }
    }

    async resolveDispute(disputeId, resolution, adminId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            logger.info(`Resolving dispute ${disputeId} by admin ${adminId}`);

            const dispute = await this.disputeRepository.findById(disputeId);
            if (!dispute) throw new Error('Dispute not found');
            if (dispute.status !== 'OPEN') throw new Error('Dispute is not open');

            await this.disputeRepository.updateStatus(disputeId, 'RESOLVED', resolution, adminId, session);
            metrics.increment('disputes.resolved');

            await session.commitTransaction();
            session.endSession();
            return { success: true, resolution };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Dispute resolution error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DisputeService();
