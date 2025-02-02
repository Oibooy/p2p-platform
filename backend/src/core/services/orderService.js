// src/core/services/orderService.js (Рефакторинг + улучшение надежности)
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');

class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async createOrder(buyerId, sellerId, amount, currency) {
        try {
            logger.info(`Creating order for buyer: ${buyerId}, seller: ${sellerId}`);
            
            const order = await this.orderRepository.create({
                buyerId,
                sellerId,
                amount,
                currency,
                status: 'PENDING'
            });
            
            metrics.increment('orders.created');
            return order;
        } catch (error) {
            logger.error(`Order creation error: ${error.message}`);
            throw error;
        }
    }

    async getOrderById(orderId) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Order not found');
            
            return order;
        } catch (error) {
            logger.error(`Fetch order error: ${error.message}`);
            throw error;
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            logger.info(`Updating order ${orderId} to status ${status}`);
            
            const updatedOrder = await this.orderRepository.updateStatus(orderId, status);
            metrics.increment(`orders.status_updated.${status.toLowerCase()}`);
            return updatedOrder;
        } catch (error) {
            logger.error(`Update order status error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new OrderService();