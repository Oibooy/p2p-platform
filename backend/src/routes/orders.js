const express = require('express');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { sendWebSocketNotification } = require('../utils/webSocket');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username reputation')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Публичный маршрут для получения активных ордеров
router.get('/public', async (req, res) => {
  const { type, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice } = req.query;

  try {
    const filter = { status: 'active' }; // Только активные ордера
    if (type) filter.type = type;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
    const orders = await Order.find(filter).sort(sortOptions).populate('user', 'username');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching public orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch public orders.' });
  }
});

// Получение всех ордеров (для авторизованных пользователей)
router.get('/', verifyToken, async (req, res) => {
  const { type, status, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice } = req.query;

  try {
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
    const orders = await Order.find(filter).sort(sortOptions).populate('user', 'username');

    if (!orders) {
      return res.status(404).json({ error: 'Orders not found' });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Create order
router.post('/', verifyToken, async (req, res) => {
  const { amount } = req.body;
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  try {
    const { type, amount, price } = req.body;
    const order = new Order({
      type,
      amount,
      price,
      status: 'active'
    });
    const savedOrder = await order.save();
    res.status(201).json({ order: savedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  try {
    const order = new Order({
      ...req.body,
      user: req.user._id
    });
    await order.save();
    sendWebSocketNotification(req.user.id, 'order_created', { orderId: order._id });
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  try {
    const order = await Order.findById(req.params.id).populate('user', 'username');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Complete order
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'open') {
      return res.status(400).json({ error: 'Order is not in an open state.' });
    }

    order.status = 'closed';
    await order.save();

    sendWebSocketNotification(order.user, 'order_completed', { orderId: order._id });
    res.status(200).json({ message: 'Order completed successfully.', order });
  } catch (error) {
    console.error('Error completing order:', error.message);
    res.status(500).json({ error: 'Failed to complete order.' });
  }
});

// Delete order
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this order.' });
    }

    await order.remove();
    res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error.message);
    res.status(500).json({ error: 'Failed to delete order.' });
  }
});

// Handle expired orders
router.patch('/:id/expire', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (new Date() > order.expiresAt) {
      order.status = 'expired';
      await order.save();

      sendWebSocketNotification(order.user, 'order_expired', { orderId: order._id });
      return res.status(200).json({ message: 'Order expired.', order });
    }

    res.status(400).json({ error: 'Order has not expired yet.' });
  } catch (error) {
    console.error('Error expiring order:', error.message);
    res.status(500).json({ error: 'Failed to expire order.' });
  }
});

module.exports = router;