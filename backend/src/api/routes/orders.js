const express = require('express');
const { verifyToken, validateRequest } = require('../middleware');
const orderController = require('../controllers/orderController');
const { createOrderValidator, getOrdersValidator } = require('../validators/orderValidator');
const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', verifyToken, getOrdersValidator, validateRequest, orderController.getAllOrders);
router.post('/', verifyToken, createOrderValidator, validateRequest, orderController.createOrder);
router.get('/:id', verifyToken, orderController.getOrderById);
router.delete('/:id', verifyToken, orderController.deleteOrder);

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