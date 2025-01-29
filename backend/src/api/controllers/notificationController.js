
const NotificationRepository = require('../../db/repositories/NotificationRepository');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationRepository = new NotificationRepository();
    
    const notifications = await notificationRepository.findByUser(userId, {
      sort: { createdAt: -1 },
      limit: 50
    });
    
    res.json(notifications);
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRepository = new NotificationRepository();
    const notification = await notificationRepository.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      throw new AppError('Уведомление не найдено', 404);
    }

    const updatedNotification = await notificationRepository.update(
      notificationId,
      { read: true }
    );

    res.json(updatedNotification);
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
    }
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationRepository = new NotificationRepository();
    
    await notificationRepository.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    logger.info({
      event: 'notifications_marked_read',
      userId
    });

    res.json({ message: 'Все уведомления помечены как прочитанные' });
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRepository = new NotificationRepository();
    const result = await notificationRepository.deleteOne({
      _id: notificationId,
      user: userId
    });

    if (!result) {
      throw new AppError('Уведомление не найдено', 404);
    }

    logger.info({
      event: 'notification_deleted',
      notificationId,
      userId
    });

    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при удалении уведомления' });
    }
  }
};
