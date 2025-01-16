const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/authMiddleware');

// Получить все уведомления для пользователя
router.get('/', verifyToken, async (req, res) => {
  const { isRead, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

  try {
    const filter = { user: req.user._id };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true'; // Преобразование строки в булевое значение
    }

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(filter)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({ notifications, total });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Обновить статус уведомления на "прочитанное"
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json(notification);
  } catch (err) {
    console.error('Error updating notification:', err.message);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Создать новое уведомление
router.post('/', verifyToken, async (req, res) => {
  const { user, message, data } = req.body;

  try {
    const notification = new Notification({
      user,
      message,
      data,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    console.error('Error creating notification:', err.message);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
});

// Удалить уведомление по ID
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

// Удалить все уведомления пользователя
router.delete('/', verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: 'All notifications deleted successfully.' });
  } catch (err) {
    console.error('Error deleting notifications:', err.message);
    res.status(500).json({ error: 'Failed to delete notifications.' });
  }
});

// Отметить все уведомления как прочитанные
router.patch('/mark-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
