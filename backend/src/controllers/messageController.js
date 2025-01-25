
const Message = require('../models/Message');
const Deal = require('../models/Deal');
const logger = require('../utils/logger');
const { notifyUser } = require('../utils/notifications');

// Получение сообщений сделки
exports.getDealMessages = async (req, res) => {
  try {
    const { dealId } = req.params;
    const messages = await Message.getDealMessages(dealId);
    res.json(messages);
  } catch (error) {
    logger.error('Error in getDealMessages:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
};

// Создание нового сообщения
exports.createMessage = async (req, res) => {
  try {
    const { dealId, content } = req.body;
    const senderId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    const message = await Message.createMessage(dealId, senderId, content);

    // Уведомление другого участника сделки
    const recipientId = deal.buyer.equals(senderId) ? deal.seller : deal.buyer;
    await notifyUser(recipientId, 'new_message', {
      dealId,
      messageId: message._id
    });

    res.status(201).json(message);
  } catch (error) {
    logger.error('Error in createMessage:', error);
    res.status(500).json({ error: 'Ошибка при создании сообщения' });
  }
};

// Модерация сообщения
exports.moderateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    await message.moderate();
    res.json(message);
  } catch (error) {
    logger.error('Error in moderateMessage:', error);
    res.status(500).json({ error: 'Ошибка при модерации сообщения' });
  }
};

// Получение непромодерированных сообщений
exports.getUnmoderatedMessages = async (req, res) => {
  try {
    const messages = await Message.getUnmoderatedMessages();
    res.json(messages);
  } catch (error) {
    logger.error('Error in getUnmoderatedMessages:', error);
    res.status(500).json({ error: 'Ошибка при получении непромодерированных сообщений' });
  }
};
