
const express = require('express');
const { verifyToken, validateRequest } = require('../middleware');
const orderController = require('../controllers/orderController');
const { createOrderValidator, getOrdersValidator } = require('../validators/orderValidator');
const { AppError } = require('../../infrastructure/errors');

const router = express.Router();

// Public routes
router.get('/public', orderController.getPublicOrders);

// Protected routes
router.get('/', verifyToken, getOrdersValidator, validateRequest, orderController.getAllOrders);

router.post('/', verifyToken, createOrderValidator, validateRequest, orderController.createOrder);
router.get('/:id', verifyToken, orderController.getOrderById);
router.delete('/:id', verifyToken, orderController.deleteOrder);

router.patch('/:id/complete', verifyToken, async (req, res, next) => {
  try {
    const order = await orderController.completeOrder(req.params.id, req.user.userId);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/expire', verifyToken, async (req, res, next) => {
  try {
    const order = await orderController.expireOrder(req.params.id, req.user.userId);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
