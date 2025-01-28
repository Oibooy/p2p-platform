
const Deal = require('../../db/models/Deal');
const Order = require('../../db/models/Order');
const User = require('../../db/models/User');
const logger = require('../../infrastructure/logger');
const { sendNotification } = require('../../infrastructure/notifications');

// Создание новой сделки
exports.createDeal = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'OrderId is required' });
    }
    const userId = req.user.id;
    
    // Rate limiting check
    const dealCount = await Deal.countDocuments({ 
      buyer: userId,
      createdAt: { $gt: new Date(Date.now() - 24*60*60*1000) }
    });
    if (dealCount >= 50) {
      return res.status(429).json({ error: 'Daily deal limit exceeded' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ордер не найден' });
    }

    if (order.user.toString() === userId) {
      return res.status(400).json({ error: 'Нельзя создать сделку с собственным ордером' });
    }

    const deal = await Deal.create({
      order: orderId,
      buyer: order.type === 'sell' ? userId : order.user,
      seller: order.type === 'sell' ? order.user : userId,
      amount: order.amount,
      price: order.price,
      status: 'pending'
    });

    // Уведомляем участников сделки
    await sendNotification(order.user, 'new_deal', { dealId: deal._id });
    await sendNotification(userId, 'new_deal', { dealId: deal._id });

    res.status(201).json(deal);
  } catch (error) {
    logger.error('Error in createDeal:', error);
    res.status(500).json({ error: 'Ошибка при создании сделки' });
  }
};

// Получение сделок пользователя
exports.getUserDeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const deals = await Deal.find({
      $or: [{ buyer: userId }, { seller: userId }]
    })
    .populate('order')
    .populate('buyer', 'username')
    .populate('seller', 'username');

    res.json(deals);
  } catch (error) {
    logger.error('Error in getUserDeals:', error);
    res.status(500).json({ error: 'Ошибка при получении сделок' });
  }
};

// Подтверждение сделки
exports.confirmDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    if (deal.buyer.toString() !== userId && deal.seller.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для подтверждения сделки' });
    }

    if (userId === deal.buyer.toString()) {
      deal.buyerConfirmed = true;
    } else {
      deal.sellerConfirmed = true;
    }

    if (deal.buyerConfirmed && deal.sellerConfirmed) {
      deal.status = 'completed';
      // Обновляем статус ордера
      await Order.findByIdAndUpdate(deal.order, { status: 'completed' });
    }

    await deal.save();
    res.json(deal);
  } catch (error) {
    logger.error('Error in confirmDeal:', error);
    res.status(500).json({ error: 'Ошибка при подтверждении сделки' });
  }
};

// Отмена сделки
exports.cancelDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    if (deal.buyer.toString() !== userId && deal.seller.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для отмены сделки' });
    }

    if (deal.status !== 'pending') {
      return res.status(400).json({ error: 'Нельзя отменить завершенную сделку' });
    }

    deal.status = 'cancelled';
    await deal.save();

    // Уведомляем участников об отмене
    const otherUserId = userId === deal.buyer.toString() ? deal.seller : deal.buyer;
    await sendNotification(otherUserId, 'deal_cancelled', { dealId: deal._id });

    res.json({ message: 'Сделка отменена', deal });
  } catch (error) {
    logger.error('Error in cancelDeal:', error);
    res.status(500).json({ error: 'Ошибка при отмене сделки' });
  }
};
