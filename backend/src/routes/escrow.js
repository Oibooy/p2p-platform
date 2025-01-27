// Escrow routes implementation
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { depositFunds, releaseFunds, refundFunds } = require('../services/escrowService');

// Депозит средств
router.post('/deposit', verifyToken, async (req, res) => {
  try {
    const { dealId, amount } = req.body;
    const result = await depositFunds(dealId, amount, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Разблокировка средств
router.post('/release', verifyToken, async (req, res) => {
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
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await releaseFunds(dealId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Возврат средств
router.post('/refund', verifyToken, async (req, res) => {
  const { dealId } = req.body;

  if (!dealId) {
    return res.status(400).json({ error: 'dealId is required.' });
  }

  try {
    const deal = await Deal.findById(dealId);
    if (!deal || deal.status !== 'funded') {
      return res.status(400).json({ error: 'Deal is not funded or does not exist.' });
    }

    if (req.user.address !== deal.buyer) {
      return res.status(403).json({ error: 'Unauthorized action.' });
    }

    const result = await refundFunds(dealId);

    if (!result.success) {
      console.error('Refund error:', result.error);
      return res.status(400).json({ error: result.error });
    }

    deal.status = 'refunded';
    await deal.save();

    sendNotification(deal.seller, 'Funds refunded successfully', deal._id);

    console.log('Refund successful:', result.tx);
    res.json({ message: 'Funds refunded successfully', tx: result.tx });
  } catch (error) {
    console.error('Unhandled error in refund:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;