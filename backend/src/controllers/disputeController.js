
const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

// Получение списка всех споров
exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('order')
      .populate('initiator', 'username email')
      .populate('moderator', 'username email');
    res.json(disputes);
  } catch (error) {
    logger.error('Error in getAllDisputes:', error);
    res.status(500).json({ error: 'Ошибка при получении списка споров' });
  }
};

// Создание нового спора
exports.createDispute = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId || !reason || reason.length < 10) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    const userId = req.user.id;

    // Проверка лимитов
    const disputeCount = await Dispute.countDocuments({
      initiator: userId,
      createdAt: { $gt: new Date(Date.now() - 24*60*60*1000) }
    });
    if (disputeCount >= 5) {
      return res.status(429).json({ error: 'Daily dispute limit exceeded' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const dispute = await Dispute.createDispute(orderId, userId, reason);
    
    // Отправка уведомления администратору
    await sendEmail(
      process.env.ADMIN_EMAIL,
      'Новый спор',
      `Создан новый спор по заказу ${orderId}. Причина: ${reason}`
    );

    res.status(201).json(dispute);
  } catch (error) {
    logger.error('Error in createDispute:', error);
    res.status(500).json({ error: 'Ошибка при создании спора' });
  }
};

// Разрешение спора
exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const moderatorId = req.user.id;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ error: 'Спор не найден' });
    }

    await dispute.assignModerator(moderatorId);
    await dispute.resolve(resolution);

    // Обновление статуса заказа
    const order = await Order.findById(dispute.order);
    order.status = resolution === 'refund' ? 'refunded' : 'completed';
    await order.save();

    // Отправка уведомлений участникам
    await sendEmail(
      order.buyer.email,
      'Спор разрешен',
      `Спор по заказу ${order._id} был разрешен. Решение: ${resolution}`
    );

    res.json(dispute);
  } catch (error) {
    logger.error('Error in resolveDispute:', error);
    res.status(500).json({ error: 'Ошибка при разрешении спора' });
  }
};

// Получение деталей спора
exports.getDisputeDetails = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('order')
      .populate('initiator', 'username email')
      .populate('moderator', 'username email');

    if (!dispute) {
      return res.status(404).json({ error: 'Спор не найден' });
    }

    res.json(dispute);
  } catch (error) {
    logger.error('Error in getDisputeDetails:', error);
    res.status(500).json({ error: 'Ошибка при получении деталей спора' });
  }
};
