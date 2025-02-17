const AuthService = require('../core/services/authService');
const { body, validationResult } = require('express-validator');
const logger = require('../../infrastructure/logger');

class AuthController {
  static async telegramAuth(req, res) {
    try {
      // Валидация входных данных
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const token = await AuthService.authenticateTelegramUser(req.body);
      if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication failed' });
      }

      logger.info(`✅ Пользователь аутентифицирован через Telegram`);
      res.status(200).json({ success: true, token });
    } catch (error) {
      logger.error(`❌ Ошибка аутентификации: ${error.message}`);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
