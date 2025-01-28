
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { depositFunds, releaseFunds, refundFunds } = require('../services/escrowService');
const { validateAmount } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const logger = require('../../infrastructure/logger');

// Rate limiting
const escrowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Депозит средств
router.post('/deposit', escrowLimiter, verifyToken, validateAmount, async (req, res) => {
  try {
    const { dealId, amount } = req.body;
    if (!dealId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit parameters' });
    }

    logger.info(`Deposit attempt: dealId=${dealId}, amount=${amount}, userId=${req.user.id}`);
    const result = await depositFunds(dealId, amount, req.user.id);
    
    logger.info(`Deposit success: dealId=${dealId}, txId=${result.txId}`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Deposit error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Разблокировка средств
router.post('/release', escrowLimiter, verifyToken, async (req, res) => {
  try {
    const { dealId } = req.body;
    if (!dealId) {
      return res.status(400).json({ error: 'Deal ID is required' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    if (deal.seller !== req.user.id) {
      logger.warn(`Unauthorized release attempt: dealId=${dealId}, userId=${req.user.id}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await releaseFunds(dealId, req.user.id);
    logger.info(`Funds released: dealId=${dealId}, txId=${result.txId}`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Release error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Возврат средств
router.post('/refund', escrowLimiter, verifyToken, async (req, res) => {
  try {
    const { dealId } = req.body;
    if (!dealId) {
      return res.status(400).json({ error: 'dealId is required' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal || deal.status !== 'funded') {
      return res.status(400).json({ error: 'Deal is not funded or does not exist' });
    }

    if (req.user.address !== deal.buyer) {
      logger.warn(`Unauthorized refund attempt: dealId=${dealId}, userId=${req.user.id}`);
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const result = await refundFunds(dealId);
    if (!result.success) {
      logger.error(`Refund failed: dealId=${dealId}, error=${result.error}`);
      return res.status(400).json({ error: result.error });
    }

    deal.status = 'refunded';
    await deal.save();

    logger.info(`Refund successful: dealId=${dealId}, txId=${result.tx}`);
    res.json({ message: 'Funds refunded successfully', tx: result.tx });
  } catch (error) {
    logger.error(`Refund error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
