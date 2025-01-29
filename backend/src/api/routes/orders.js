const express = require('express');
const { verifyToken, validateRequest } = require('../middleware');
const orderController = require('../controllers/orderController');
const { createOrderValidator, getOrdersValidator } = require('../validators/orderValidator');
const { AppError } = require('../../infrastructure/errors');

const router = express.Router();

// Public routes
router.get('/public', orderController.getPublicOrders);

// Protected routes - Order CRUD
router.route('/')
  .get(verifyToken, getOrdersValidator, validateRequest, orderController.getAllOrders)
  .post(verifyToken, createOrderValidator, validateRequest, orderController.createOrder);

router.route('/:id')
  .get(verifyToken, orderController.getOrderById)
  .delete(verifyToken, orderController.deleteOrder);

// Protected routes - Order status management
router.patch('/:id/complete', verifyToken, orderController.handleOrderComplete);
router.patch('/:id/expire', verifyToken, orderController.handleOrderExpire);

module.exports = router;