
const express = require('express');
const { verifyToken, validateRequest } = require('../middleware');
const orderController = require('../controllers/orderController');
const { createOrderValidator, getOrdersValidator } = require('../validators/orderValidator');

const router = express.Router();

// Public routes
router.get('/public', orderController.getPublicOrders);

// Protected routes - Order CRUD
router.get('/', verifyToken, getOrdersValidator, validateRequest, orderController.getAllOrders);
router.post('/', verifyToken, createOrderValidator, validateRequest, orderController.createOrder);
router.get('/:id', verifyToken, orderController.getOrderById);
router.delete('/:id', verifyToken, orderController.deleteOrder);

// Protected routes - Order status management
router.patch('/:id/complete', verifyToken, orderController.handleOrderComplete);
router.patch('/:id/expire', verifyToken, orderController.handleOrderExpire);

module.exports = router;
