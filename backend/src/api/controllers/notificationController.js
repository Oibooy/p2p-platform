
const Notification = require('../../db/models/Notification');
const logger = require('../../infrastructure/logger');

// Получение уведомлений пользователя
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
};

// Пометить уведомление как прочитанное
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
};

// Пометить все уведомления как прочитанные
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Все уведомления помечены как прочитанные' });
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
};

// Удаление уведомления
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    res.status(500).json({ error: 'Ошибка при удалении уведомления' });
  }
};
