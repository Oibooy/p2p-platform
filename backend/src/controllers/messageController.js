
const Message = require('../models/Message');
const Deal = require('../models/Deal');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');

// Получение сообщений для конкретной сделки
exports.getDealMessages = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Проверка прав доступа
    if (deal.buyer.toString() !== userId && deal.seller.toString() !== userId) {
      return res.status(403).json({ error: 'Нет доступа к сообщениям этой сделки' });
    }

    const messages = await Message.find({ deal: dealId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username');

    res.json(messages);
  } catch (error) {
    logger.error('Error in getDealMessages:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
};

// Отправка нового сообщения
exports.sendMessage = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    if (deal.buyer.toString() !== senderId && deal.seller.toString() !== senderId) {
      return res.status(403).json({ error: 'Нет прав для отправки сообщения' });
    }

    const message = await Message.create({
      deal: dealId,
      sender: senderId,
      content
    });

    // Отправка уведомления получателю
    const recipientId = deal.buyer.toString() === senderId ? deal.seller : deal.buyer;
    await sendNotification(recipientId, 'new_message', { dealId, messageId: message._id });

    await message.populate('sender', 'username');
    res.status(201).json(message);
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
};

// Удаление сообщения
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления сообщения' });
    }

    await message.remove();
    res.json({ message: 'Сообщение удалено' });
  } catch (error) {
    logger.error('Error in deleteMessage:', error);
    res.status(500).json({ error: 'Ошибка при удалении сообщения' });
  }
};
