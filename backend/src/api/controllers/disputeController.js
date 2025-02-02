// controllers/disputeController.js
const DisputeService = require('../core/services/DisputeService');

class DisputeController {
  static async createDispute(req, res) {
    try {
      const dispute = await DisputeService.createDispute(req.user.id, req.body.orderId, req.body.reason);
      res.json({ dispute });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create dispute' });
    }
  }

  static async resolveDispute(req, res) {
    try {
      const resolution = req.body.resolution;
      const response = await DisputeService.resolveDispute(req.params.id, resolution);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve dispute' });
    }
  }
}

module.exports = DisputeController;
