// Escrow routes implementation
const express = require('express');
const { depositFunds, releaseFunds, refundFunds } = require('../services/escrowService');
const { verifyToken } = require('../middleware/authMiddleware');
const Deal = require('../models/Deal'); // Модель для хранения сделок
const { sendNotification } = require('../utils/notifications');
const router = express.Router();

// Депозит средств
router.post('/deposit', verifyToken, async (req, res) => {
  const { dealId, amount } = req.body;

  if (!dealId || !amount) {
    return res.status(400).json({ error: 'dealId and amount are required.' });
  }

  try {
    const deal = await Deal.findById(dealId);
    if (!deal || deal.status !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive deal.' });
    }

    const result = await depositFunds(deal.buyer, amount);

    if (!result.success) {
      console.error('Deposit error:', result.error);
      return res.status(400).json({ error: result.error });
    }

    deal.status = 'funded';
    await deal.save();

    sendNotification(deal.seller, 'Funds deposited successfully', deal._id);

    console.log('Deposit successful:', result.tx);
    res.json({ message: 'Funds deposited successfully', tx: result.tx });
  } catch (error) {
    console.error('Unhandled error in deposit:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Разблокировка средств
router.post('/release', verifyToken, async (req, res) => {
  const { dealId } = req.body;

  if (!dealId) {
    return res.status(400).json({ error: 'dealId is required.' });
  }

  try {
    const deal = await Deal.findById(dealId);
    if (!deal || deal.status !== 'funded') {
      return res.status(400).json({ error: 'Deal is not funded or does not exist.' });
    }

    if (req.user.address !== deal.seller) {
      return res.status(403).json({ error: 'Unauthorized action.' });
    }

    const result = await releaseFunds(dealId);

    if (!result.success) {
      console.error('Release error:', result.error);
      return res.status(400).json({ error: result.error });
    }

    deal.status = 'completed';
    await deal.save();

    sendNotification(deal.buyer, 'Funds released successfully', deal._id);

    console.log('Release successful:', result.tx);
    res.json({ message: 'Funds released successfully', tx: result.tx });
  } catch (error) {
    console.error('Unhandled error in release:', error.message);
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

router.post('/release', verifyToken, async (req, res) => {
  try {
    const { dealId } = req.body;
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    if (deal.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to release this escrow' });
    }
    await deal.release();
    res.status(200).json({ message: 'Funds released successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


