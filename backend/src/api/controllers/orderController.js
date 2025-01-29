const OrderRepository = require('../../db/repositories/OrderRepository');
const { AppError, ValidationError } = require('../../infrastructure/errors');
const logger = require('../../infrastructure/logger');
const { sendWebSocketNotification } = require('../../infrastructure/webSocket');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { type, status, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const orderRepository = new OrderRepository();

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const [orders, total] = await Promise.all([
      orderRepository.findWithPagination(filter, {
        sort: { [sortBy]: order === 'desc' ? -1 : 1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        populate: 'user'
      }),
      orderRepository.count(filter)
    ]);

    return res.status(200).json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasMore: (page - 1) * limit + orders.length < total
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    throw new AppError('Failed to fetch orders', 500);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, type, price, expirationHours = 24 } = req.body;
    const orderRepository = new OrderRepository();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const order = await orderRepository.create({
      type,
      amount,
      price,
      status: 'open',
      user: req.user._id,
      expiresAt
    });

    await order.populate('user', 'username reputation');

    sendWebSocketNotification(req.user._id, 'order_created', {
      orderId: order._id,
      type: order.type,
      amount: order.amount,
      price: order.price
    });

    res.status(201).json(order);
  } catch (error) {
    logger.error('Error creating order:', error);
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw new AppError('Failed to create order', 500);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderRepository = new OrderRepository();
    const order = await orderRepository.findById(req.params.id, {
      populate: 'user'
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

exports.getPublicOrders = async (req, res, next) => {
  try {
    const orderRepository = new OrderRepository();
    const { type, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice } = req.query;
    const filter = { status: 'active' };
    
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const orders = await orderRepository.find(filter, {
      sort: { [sortBy]: order === 'desc' ? -1 : 1 },
      populate: 'user'
    });
    
    return res.status(200).json(orders);
  } catch (error) {
    logger.error('Error fetching public orders:', error);
    next(new AppError('Failed to fetch public orders', 500));
  }
};

exports.completeOrder = async (orderId, userId) => {
  const order = await OrderRepository.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (order.status !== 'open') {
    throw new AppError('Order is not in an open state', 400);
  }
  
  if (order.user.toString() !== userId) {
    throw new AppError('Unauthorized to complete this order', 403);
  }

  order.status = 'closed';
  await order.save();
  
  await sendWebSocketNotification(order.user, 'order_completed', { orderId: order._id });
  return order;
};

exports.handleOrderComplete = async (req, res, next) => {
  try {
    const order = await exports.completeOrder(req.params.id, req.user._id);
    res.status(200).json(order);
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error.message, 500));
  }
};

exports.handleOrderExpire = async (req, res, next) => {
  try {
    const order = await exports.expireOrder(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error.message, 500));
  }
};

exports.expireOrder = async (orderId) => {
  const order = await OrderRepository.findById(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (new Date() <= order.expiresAt) {
    throw new AppError('Order has not expired yet', 400);
  }

  order.status = 'expired';
  await order.save();
  
  await sendWebSocketNotification(order.user, 'order_expired', { orderId: order._id });
  return order;
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderRepository = new OrderRepository();
    const order = await orderRepository.findOne({ 
      _id: req.params.id,
      user: req.user._id,
      status: 'open'
    });

    if (!order) {
      throw new AppError('Order not found or cannot be deleted', 404);
    }

    await orderRepository.delete(req.params.id);
    sendWebSocketNotification(req.user._id, 'order_deleted', { orderId: req.params.id });

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    logger.error('Error deleting order:', error);
    throw new AppError('Failed to delete order', 500);
  }
};


  
  
  