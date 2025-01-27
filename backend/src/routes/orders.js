const express = require('express');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { sendWebSocketNotification } = require('../utils/webSocket');
const router = express.Router();

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

// Создание нового ордера
router.post('/', verifyToken, async (req, res) => {
  const { type, amount, price, expiresAt } = req.body;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated properly' });
    }

    const order = new Order({
      user: req.user._id,
      type,
      amount,
      price,
      expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000),
    });

    await order.save();
    sendWebSocketNotification(req.user.id, 'order_created', { orderId: order._id });

    res.status(201).json({ message: 'Order created successfully.', order });
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Получение конкретного ордера
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  try {
    const order = await Order.findById(id).populate('user', 'username');
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

// Завершение ордера
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

// Удаление ордера
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

// Маршрут для обработки истёкших ордеров
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


