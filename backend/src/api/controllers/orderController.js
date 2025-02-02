// src/api/controllers/orderController.js (Рефакторинг)
const express = require('express');
const router = express.Router();
const escrowService = require('../../core/services/escrowService');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');

const orderRepository = new OrderRepository();

// Создание ордера
router.post('/create', async (req, res) => {
    try {
        const { sender, receiver, amount } = req.body;
        
        const order = await orderRepository.createOrder(sender, receiver, amount);
        logger.info(`Order ${order.id} created successfully`);
        
        res.status(201).json({ success: true, order });
    } catch (error) {
        logger.error(`Order creation error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Инициация сделки через эскроу
router.post('/:orderId/initiate', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { sender, receiver, amount } = req.body;
        
        const transaction = await escrowService.initiateTransaction(orderId, sender, receiver, amount);
        res.status(200).json({ success: true, transaction });
    } catch (error) {
        logger.error(`Escrow initiation error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Подтверждение сделки
router.post('/:orderId/confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { txID } = req.body;
        
        const confirmation = await escrowService.confirmTransaction(orderId, txID);
        res.status(200).json(confirmation);
    } catch (error) {
        logger.error(`Transaction confirmation error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;