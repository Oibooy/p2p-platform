// controllers/walletController.js
const WalletService = require('../core/services/WalletService');

class WalletController {
  static async getBalance(req, res) {
    try {
      const balance = await WalletService.getBalance(req.user.id);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }

  static async deposit(req, res) {
    try {
      const { amount } = req.body;
      const newBalance = await WalletService.deposit(req.user.id, amount);
      res.json({ balance: newBalance });
    } catch (error) {
      res.status(500).json({ error: 'Deposit failed' });
    }
  }

  static async withdraw(req, res) {
    try {
      const { amount } = req.body;
      const newBalance = await WalletService.withdraw(req.user.id, amount);
      res.json({ balance: newBalance });
    } catch (error) {
      res.status(500).json({ error: 'Withdrawal failed' });
    }
  }
}

module.exports = WalletController;