
const DisputeRepository = require('../../db/repositories/DisputeRepository');
const OrderRepository = require('../../db/repositories/OrderRepository');
const NotificationRepository = require('../../db/repositories/NotificationRepository');
const { AppError } = require('../../infrastructure/errors');
const { sendEmail } = require('../../infrastructure/emailSender');
const logger = require('../../infrastructure/logger');

class DisputeService {
  constructor() {
    this.disputeRepository = new DisputeRepository();
    this.orderRepository = new OrderRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async getAllDisputes(filters = {}) {
    return this.disputeRepository.findPendingDisputes();
  }

  async getDisputeDetails(disputeId) {
    const dispute = await this.disputeRepository.findByIdWithDetails(disputeId);
    if (!dispute) {
      throw new AppError('Спор не найден', 404);
    }
    return dispute;
  }

  async createDispute(orderId, userId, reason, evidence, session) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Заказ не найден', 404);
    }

    // Создание спора в транзакции
    const dispute = await this.disputeRepository.create({
      order: orderId,
      initiator: userId,
      reason,
      evidence,
      status: 'pending'
    }, session);

    // Обновление статуса заказа
    await this.orderRepository.updateStatus(orderId, 'disputed', session);

    // Отправка уведомлений
    await this._sendDisputeNotifications(dispute, order);

    return dispute;
  }

  async resolveDispute(disputeId, moderatorId, resolution, comment, session) {
    const dispute = await this.disputeRepository.findByIdWithTransaction(disputeId, session);
    if (!dispute) {
      throw new AppError('Спор не найден', 404);
    }

    if (dispute.status === 'resolved') {
      throw new AppError('Спор уже разрешен', 400);
    }

    // Обновление спора
    dispute.moderator = moderatorId;
    dispute.resolution = resolution;
    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    if (comment) {
      dispute.comments.push({ author: moderatorId, text: comment });
    }

    await dispute.save({ session });

    // Обновление статуса заказа
    const newOrderStatus = resolution === 'refund' ? 'refunded' : 'completed';
    await this.orderRepository.updateStatus(dispute.order, newOrderStatus, session);

    // Отправка уведомлений
    await this._sendResolutionNotifications(dispute);

    return dispute;
  }

  async _sendDisputeNotifications(dispute, order) {
    try {
      // Уведомление администратора
      await sendEmail(
        process.env.ADMIN_EMAIL,
        'Новый спор',
        `Создан новый спор по заказу ${order._id}. Причина: ${dispute.reason}`
      );

      // Уведомление участников
      await this.notificationRepository.create({
        user: order.seller,
        type: 'dispute_created',
        message: `По вашему заказу ${order._id} открыт спор`,
        reference: dispute._id
      });
    } catch (error) {
      logger.error('Ошибка отправки уведомлений:', error);
    }
  }

  async _sendResolutionNotifications(dispute) {
    try {
      const order = await this.orderRepository.findById(dispute.order);
      const participants = [order.buyer, order.seller];

      for (const userId of participants) {
        await this.notificationRepository.create({
          user: userId,
          type: 'dispute_resolved',
          message: `Спор по заказу ${order._id} разрешен. Решение: ${dispute.resolution}`,
          reference: dispute._id
        });
      }
    } catch (error) {
      logger.error('Ошибка отправки уведомлений о разрешении:', error);
    }
  }
}

module.exports = new DisputeService();
