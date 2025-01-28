
const Message = require('../../db/models/Message');
const Deal = require('../../db/models/Deal');
const logger = require('../../infrastructure/logger');
const { sendNotification } = require('../../infrastructure/notifications');

// Отправка сообщения
exports.sendMessage = async (req, res) => {
  try {
    const { dealId, content } = req.body;
    const senderId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Проверяем, является ли пользователь участником сделки
    if (deal.buyer.toString() !== senderId && deal.seller.toString() !== senderId) {
      return res.status(403).json({ error: 'Нет прав для отправки сообщения' });
    }

    const message = await Message.create({
      deal: dealId,
      sender: senderId,
      content,
      readBy: [senderId]
    });

    // Определяем получателя уведомления
    const recipientId = deal.buyer.toString() === senderId ? deal.seller : deal.buyer;
    await sendNotification(recipientId, 'new_message', { dealId, messageId: message._id });

    res.status(201).json(message);
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
};

// Получение сообщений сделки
exports.getDealMessages = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Проверяем, является ли пользователь участником сделки
    if (deal.buyer.toString() !== userId && deal.seller.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для просмотра сообщений' });
    }

    const messages = await Message.find({ deal: dealId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    logger.error('Error in getDealMessages:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
};

// Отметить сообщения как прочитанные
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Обновляем все непрочитанные сообщения в сделке
    await Message.updateMany(
      {
        deal: dealId,
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.json({ message: 'Сообщения отмечены как прочитанные' });
  } catch (error) {
    logger.error('Error in markMessagesAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса сообщений' });
  }
};
