const User = require('../../db/models/User');

const isModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate('role');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role.name !== 'moderator' && user.role.name !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён. Требуется роль модератора.' });
    }

    next();
  } catch (error) {
    console.error('Ошибка в middleware модератора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate('role');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role.name !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён. Требуется роль администратора.' });
    }

    next();
  } catch (error) {
    console.error('Ошибка в middleware администратора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).populate('role');

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(user.role.name)) {
        return res.status(403).json({ 
          error: `Доступ запрещён. Требуется одна из ролей: ${allowedRoles.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Ошибка в middleware проверки роли:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
};

module.exports = {
  isModerator,
  isAdmin,
  hasRole
};