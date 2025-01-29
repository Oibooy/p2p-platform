const UserRepository = require('../../db/repositories/UserRepository');
const { ForbiddenError, NotFoundError } = require('../../infrastructure/errors'); // Assuming this is where custom errors are defined


const isModerator = async (req, res, next) => {
  try {
    const user = await UserRepository.findById(req.user.userId).populate('role');

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    if (user.role.name !== 'moderator' && user.role.name !== 'admin') {
      throw new ForbiddenError('Доступ запрещён. Требуется роль модератора.');
    }

    next();
  } catch (error) {
    console.error('Ошибка в middleware модератора:', error);
    next(error); // Pass the error to the error handling middleware
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await UserRepository.findById(req.user.userId).populate('role');

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    if (user.role.name !== 'admin') {
      throw new ForbiddenError('Доступ запрещён. Требуется роль администратора.');
    }

    next();
  } catch (error) {
    console.error('Ошибка в middleware администратора:', error);
    next(error); // Pass the error to the error handling middleware
  }
};

const hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await UserRepository.findById(req.user.userId).populate('role');

      if (!user) {
        throw new NotFoundError('Пользователь не найден');
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(user.role.name)) {
        throw new ForbiddenError(`Доступ запрещён. Требуется одна из ролей: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      console.error('Ошибка в middleware проверки роли:', error);
      next(error); // Pass the error to the error handling middleware
    }
  };
};

module.exports = {
  isModerator,
  isAdmin,
  hasRole
};