
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

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

// Отметить уведомление как прочитанное
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для этого действия' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
};

// Отметить все уведомления как прочитанные
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
};

// Удаление уведомления
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления уведомления' });
    }

    await notification.remove();
    res.json({ message: 'Уведомление успешно удалено' });
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    res.status(500).json({ error: 'Ошибка при удалении уведомления' });
  }
};
