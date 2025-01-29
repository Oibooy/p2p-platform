const Order = require('../../db/models/Order');
const logger = require('../../infrastructure/logger');

const orderController = {
  getPublicOrders: async (req, res, next) => {
    try {
      const orders = await Order.find({ isPublic: true });
      res.json(orders);
    } catch (error) {
      logger.error('Error in getPublicOrders:', error);
      next(error);
    }
  },

  getAllOrders: async (req, res, next) => {
    try {
      const orders = await Order.find();
      res.json(orders);
    } catch (error) {
      logger.error('Error in getAllOrders:', error);
      next(error);
    }
  },

  createOrder: async (req, res, next) => {
    try {
      const order = new Order(req.body);
      await order.save();
      res.status(201).json(order);
    } catch (error) {
      logger.error('Error in createOrder:', error);
      next(error);
    }
  },

  getOrderById: async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      logger.error('Error in getOrderById:', error);
      next(error);
    }
  },

  deleteOrder: async (req, res, next) => {
    try {
      const order = await Order.findByIdAndDelete(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteOrder:', error);
      next(error);
    }
  },

  handleOrderComplete: async (req, res, next) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: 'completed' },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      logger.error('Error in handleOrderComplete:', error);
      next(error);
    }
  },

  handleOrderExpire: async (req, res, next) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: 'expired' },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      logger.error('Error in handleOrderExpire:', error);
      next(error);
    }
  }
};

module.exports = orderController;