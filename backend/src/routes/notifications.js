// routes/notifications.js - Маршруты для управления уведомлениями
const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();


// Получение количества непрочитанных уведомлений
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    res.status(500).json({ error: 'Failed to get unread notifications count' });
  }
});


// Получение текущих настроек уведомлений
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ 
      notificationSettings: user.notificationSettings || {
        email: true,
        sms: false,
        push: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  try {
    const user = await User.findById(req.user.id, 'notificationSettings');
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.status(200).json({ notificationSettings: user.notificationSettings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление настроек уведомлений
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const { email, sms, push } = req.body;

    // Проверка входных данных
    if (
      email !== undefined && typeof email !== 'boolean' ||
      sms !== undefined && typeof sms !== 'boolean' ||
      push !== undefined && typeof push !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Неверный формат данных. Ожидаются Boolean значения для email, sms, push.' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновление настроек
    user.notificationSettings = {
      email: email !== undefined ? email : user.notificationSettings.email,
      sms: sms !== undefined ? sms : user.notificationSettings.sms,
      push: push !== undefined ? push : user.notificationSettings.push,
    };

    await user.save();
    res.status(200).json({ message: 'Настройки уведомлений обновлены', notificationSettings: user.notificationSettings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение уведомлений пользователя
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;
    const filter = { user: req.user.id };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({ total, page: Number(page), limit: Number(limit), notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Пометить уведомление как прочитанное
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Уведомление помечено как прочитанное' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление уведомлений
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.status(200).json({ message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить все уведомления пользователя
router.delete('/', verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.status(200).json({ message: 'Все уведомления удалены' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сброс настроек уведомлений к значениям по умолчанию
router.post('/settings/reset', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Сброс настроек к значениям по умолчанию
    user.notificationSettings = {
      email: true,
      sms: false,
      push: true,
    };

    await user.save();
    res.status(200).json({ message: 'Настройки уведомлений сброшены к значениям по умолчанию', notificationSettings: user.notificationSettings });
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;



