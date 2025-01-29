const express = require('express');
const { verifyToken, validateRequest } = require('../middleware');
const { getPublicOrders, getAllOrders, createOrder, getOrderById, deleteOrder} = require('../controllers/orderController');
const { createOrderValidator, getOrdersValidator } = require('../validators/orderValidator');

const router = express.Router();

// Public routes
router.get('/public', getPublicOrders);

// Protected routes - Order CRUD
router.route('/')
  .get(verifyToken, getOrdersValidator, validateRequest, getAllOrders)
  .post(verifyToken, createOrderValidator, validateRequest, createOrder);

router.route('/:id')
  .get(verifyToken, getOrderById)
  .delete(verifyToken, deleteOrder);

// Protected routes - Order status management
router.patch('/:id/complete', verifyToken, orderController.handleOrderComplete);
router.patch('/:id/expire', verifyToken, orderController.handleOrderExpire);

module.exports = router;