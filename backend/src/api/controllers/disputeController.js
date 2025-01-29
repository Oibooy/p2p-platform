const DisputeRepository = require('../../db/repositories/DisputeRepository');
const OrderRepository = require('../../db/repositories/OrderRepository');
const { sendEmail } = require('../../infrastructure/emailSender');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');
const { validateDispute } = require('../validators/disputeValidator');

exports.getAllDisputes = async (req, res, next) => {
  try {
    const disputeRepository = new DisputeRepository();
    const disputes = await disputeRepository.findAllWithDetails();

    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

// Создание нового спора
exports.createDispute = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;

    await validateDispute(req.body);

    const disputeRepository = new DisputeRepository();
    const orderRepository = new OrderRepository();

    // Проверка лимита споров
    const disputeCount = await disputeRepository.countUserDisputes(userId, 24);
    if (disputeCount >= 5) {
      return next(new AppError('Превышен дневной лимит споров', 429));
    }

    // Проверка существования заказа
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return next(new AppError('Заказ не найден', 404));
    }

    if (order.status === 'disputed') {
      return next(new AppError('Спор по этому заказу уже существует', 400));
    }

    const dispute = await disputeRepository.create(orderId, userId, reason);

    // Отправка уведомления администратору
    sendEmail(
      process.env.ADMIN_EMAIL,
      'Новый спор',
      `Создан новый спор по заказу ${orderId}. Причина: ${reason}`
    ).catch((emailError) => logger.error('Ошибка отправки email:', emailError));

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};

// Разрешение спора
exports.resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const moderatorId = req.user.id;

    const disputeRepository = new DisputeRepository();
    const orderRepository = new OrderRepository();

    const dispute = await disputeRepository.findByIdWithDetails(id);
    if (!dispute) {
      return next(new AppError('Спор не найден', 404));
    }

    if (dispute.status === 'resolved') {
      return next(new AppError('Спор уже разрешен', 400));
    }

    await disputeRepository.assignModerator(id, moderatorId);
    await disputeRepository.resolve(id, resolution);

    const order = await orderRepository.findById(dispute.order._id); // Исправлено
    const newStatus = resolution === 'refund' ? 'refunded' : 'completed';
    await orderRepository.updateStatus(order._id, newStatus);

    // Отправка уведомлений участникам
    sendEmail(
      order.buyer.email,
      'Спор разрешен',
      `Спор по заказу ${order._id} был разрешен. Решение: ${resolution}`
    ).catch((emailError) => logger.error('Ошибка отправки email:', emailError));

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};

// Получение деталей спора
exports.getDisputeDetails = async (req, res, next) => {
  try {
    const disputeRepository = new DisputeRepository();
    const dispute = await disputeRepository.findByIdWithDetails(req.params.id);

    if (!dispute) {
      return next(new AppError('Спор не найден', 404));
    }

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};
