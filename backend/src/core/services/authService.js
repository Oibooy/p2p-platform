// core/services/AuthService.js
const jwt = require('jsonwebtoken');
const { getUserByTelegramId, createUser, updateUserSession } = require('../db/repositories/UserRepository');
const config = require('../config');

class AuthService {
  static async authenticateTelegramUser(telegramData, ip, userAgent) {
    let user = await getUserByTelegramId(telegramData.id);
    if (!user) {
      user = await createUser(telegramData);
    }

    // Обновляем сессию пользователя
    await updateUserSession(user._id, ip, userAgent);

    return AuthService.generateToken(user, ip, userAgent);
  }

  static generateToken(user, ip, userAgent) {
    return jwt.sign({ id: user._id, telegramId: user.telegramId, ip, userAgent }, config.jwtSecret, { expiresIn: '7d' });
  }
}

module.exports = AuthService;