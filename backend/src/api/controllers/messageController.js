const MessageRepository = require('../../db/repositories/MessageRepository');
const DealRepository = require('../../db/repositories/DealRepository');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');
const { sendNotification } = require('../../infrastructure/notifications');

exports.sendMessage = async (req, res) => {
  try {
    const { dealId, content } = req.body;
    const senderId = req.user.id;

    const dealRepository = new DealRepository();
    const deal = await dealRepository.findById(dealId);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    if (deal.buyer.toString() !== senderId && deal.seller.toString() !== senderId) {
      throw new AppError('Not authorized to send messages in this deal', 403);
    }

    const messageRepository = new MessageRepository();
    const message = await messageRepository.create({
      deal: dealId,
      sender: senderId,
      content,
      readBy: [senderId]
    });

    await message.populate('sender', 'username');

    const recipientId = deal.buyer.toString() === senderId ? deal.seller : deal.buyer;
    await sendNotification(recipientId, 'new_message', {
      dealId,
      messageId: message._id,
      preview: content.substring(0, 50)
    });

    res.status(201).json(message);
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

exports.getDealMessages = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const dealRepository = new DealRepository();
    const deal = await dealRepository.findById(dealId);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    if (deal.buyer.toString() !== userId && deal.seller.toString() !== userId) {
      throw new AppError('Not authorized to view these messages', 403);
    }

    const messageRepository = new MessageRepository();
    const [messages, total] = await Promise.all([
      messageRepository.findWithPagination(
        { deal: dealId },
        {
          sort: { createdAt: -1 },
          skip: (page - 1) * limit,
          limit: parseInt(limit),
          populate: {
            path: 'sender',
            select: 'username'
          }
        }
      ),
      messageRepository.count({ deal: dealId })
    ]);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (error) {
    logger.error('Error in getDealMessages:', error);
    throw new AppError(error.message, error.statusCode || 500);
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