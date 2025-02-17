const express = require('express');
const router = express.Router();
const escrowService = require('../../core/services/escrowService');
const { OrderRepository } = require('../../db/repositories/OrderRepository');
const logger = require('../../infrastructure/logger');
const { checkAuth } = require('../../middleware/authMiddleware');
const { body, param, validationResult } = require('express-validator');

const orderRepository = new OrderRepository();

// Создание ордера с валидацией
router.post('/create', 
    checkAuth,
    body('sender').isString().notEmpty(),
    body('receiver').isString().notEmpty(),
    body('amount').isNumeric().custom((value) => value > 0),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { sender, receiver, amount } = req.body;
            const existingOrder = await orderRepository.findPendingOrder(sender, receiver);
            if (existingOrder) {
                throw new Error('Duplicate order detected');
            }

            const order = await orderRepository.createOrder(sender, receiver, amount);
            logger.info(`✅ Order ${order.id} created successfully`);
            res.status(201).json({ success: true, order });
        } catch (error) {
            logger.error(`❌ Order creation error: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
});

// Инициация сделки через эскроу
router.post('/:orderId/initiate',
    checkAuth,
    param('orderId').isString().notEmpty(),
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const { sender, receiver, amount } = req.body;
            const transaction = await escrowService.initiateTransaction(orderId, sender, receiver, amount);
            res.status(200).json({ success: true, transaction });
        } catch (error) {
            logger.error(`❌ Escrow initiation error: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
});

// Подтверждение сделки с проверкой прав
router.post('/:orderId/confirm',
    checkAuth,
    param('orderId').isString().notEmpty(),
    body('txID').isString().notEmpty(),
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const { txID } = req.body;
            const confirmation = await escrowService.confirmTransaction(orderId, txID);
            res.status(200).json(confirmation);
        } catch (error) {
            logger.error(`❌ Transaction confirmation error: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
});

module.exports = router;
