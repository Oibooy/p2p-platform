const Order = require('../../db/models/Order');
const logger = require('../../infrastructure/logger');
const { sendWebSocketNotification } = require('../utils/webSocket');

exports.getAllOrders = async (req, res) => {
  const { 
    type, 
    status, 
    sortBy = 'createdAt', 
    order = 'desc', 
    minPrice, 
    maxPrice,
    page = 1,
    limit = 10 
  } = req.query;

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
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sortOptions)
        .populate('user', 'username reputation')
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasMore: skip + orders.length < total
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.createOrder = async (req, res) => {
  const { amount, type, price, expirationHours = 24 } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  if (!type || !['buy', 'sell'].includes(type)) {
    return res.status(400).json({ error: 'Invalid order type' });
  }
  if (!price || price <= 0) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const order = new Order({
      type,
      amount,
      price,
      status: 'open',
      user: req.user._id,
      expiresAt
    });

    const savedOrder = await order.save();
    await savedOrder.populate('user', 'username reputation');

    sendWebSocketNotification(req.user._id, 'order_created', { 
      orderId: savedOrder._id,
      type: savedOrder.type,
      amount: savedOrder.amount,
      price: savedOrder.price
    });

    res.status(201).json({ order: savedOrder });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username reputation');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      user: req.user._id,
      status: 'open'
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or cannot be deleted' });
    }

    await order.remove();
    sendWebSocketNotification(req.user._id, 'order_deleted', { orderId: req.params.id });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    logger.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};