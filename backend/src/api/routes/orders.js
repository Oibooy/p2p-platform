
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
router.route('/:id/status')
  .patch('/complete', verifyToken, async (req, res, next) => {
    try {
      const order = await orderController.completeOrder(req.params.id, req.user._id);
      res.status(200).json(order);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(error.message, 500));
    }
  })
  .patch('/expire', verifyToken, async (req, res, next) => {
    try {
      const order = await orderController.expireOrder(req.params.id);
      res.status(200).json(order);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(error.message, 500));
    }
  });

module.exports = router;
