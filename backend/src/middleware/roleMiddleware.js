// roleMiddleware.js - Middleware для проверки ролей пользователей
const User = require('../models/User');

// Проверка, является ли пользователь модератором
const isModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('role');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role.type !== 'moderator') {
      return res.status(403).json({ error: 'Доступ запрещён. Требуется роль модератора.' });
    }

    next();
  } catch (error) {
    console.error('Error in isModerator middleware:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Проверка, является ли пользователь администратором
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('role');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role.type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён. Требуется роль администратора.' });
    }

    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Проверка, имеет ли пользователь указанную роль
const hasRole = (requiredRole) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('role');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role.type !== requiredRole) {
      return res.status(403).json({ error: `Доступ запрещён. Требуется роль: ${requiredRole}` });
    }

    next();
  } catch (error) {
    console.error('Error in hasRole middleware:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  isModerator,
  isAdmin,
  hasRole,
};

