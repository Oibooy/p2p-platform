
const DisputeRepository = require('../../db/repositories/DisputeRepository');
const OrderRepository = require('../../db/repositories/OrderRepository');
const { sendEmail } = require('../../infrastructure/emailSender');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');
const { validateDispute } = require('../validators/disputeValidator');

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
    const userId = req.user.id;

    await validateDispute(req.body);
    
    const disputeRepository = new DisputeRepository();
    const orderRepository = new OrderRepository();

    const disputeCount = await disputeRepository.countUserDisputes(userId, 24);
    if (disputeCount >= 5) {
      throw new AppError('Превышен дневной лимит споров', 429);
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Заказ не найден', 404);
    }

    if (order.status === 'disputed') {
      throw new AppError('Спор по этому заказу уже существует', 400);
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
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const moderatorId = req.user.id;

      const disputeRepository = new DisputeRepository();
      const orderRepository = new OrderRepository();

      const dispute = await disputeRepository.findByIdWithDetails(id);
      if (!dispute) {
        throw new AppError('Спор не найден', 404);
      }

      if (dispute.status === 'resolved') {
        throw new AppError('Спор уже разрешен', 400);
      }

      await disputeRepository.assignModerator(id, moderatorId);
      await disputeRepository.resolve(id, resolution);

      const order = await orderRepository.findById(dispute.order);
      await orderRepository.updateStatus(
        order._id, 
        resolution === 'refund' ? 'refunded' : 'completed'
      );

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
