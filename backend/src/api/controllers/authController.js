// controllers/authController.js
const AuthService = require('../core/services/authService');

class AuthController {
  static async telegramAuth(req, res) {
    try {
      const token = await AuthService.authenticateTelegramUser(req.body);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
}

module.exports = AuthController;
