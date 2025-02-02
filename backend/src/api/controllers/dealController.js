// controllers/dealController.js
const P2PService = require('../core/services/P2PService');

class DealController {
  static async createOrder(req, res) {
    try {
      const order = await P2PService.createOrder(req.user.id, req.body);
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  static async acceptOrder(req, res) {
    try {
      const order = await P2PService.acceptOrder(req.user.id, req.params.id);
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept order' });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const order = await P2PService.cancelOrder(req.user.id, req.params.id);
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }
}

module.exports = DealController;