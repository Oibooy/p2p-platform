const express = require('express');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('order')
      .populate('initiator')
      .populate('defendant');
    res.status(200).json({ disputes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Получение списка споров (только для модераторов)
router.get('/', verifyToken, checkRole('moderator'), async (req, res) => {
  const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

  try {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const disputes = await Dispute.find(filter)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('order initiator moderator', 'username email');

    const total = await Dispute.countDocuments(filter);

    res.json({ disputes, total });
  } catch (err) {
    console.error('Error fetching disputes:', err.message);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// Получение конкретного спора
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('order initiator moderator', 'username email');
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    res.json(dispute);
  } catch (err) {
    console.error('Error fetching dispute:', err.message);
    res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

// Создать арбитраж
router.post('/', async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const dispute = new Dispute({
      order: order_id,
      reason
    });
    const savedDispute = await dispute.save();
    res.status(201).json(savedDispute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  const { order_id, reason } = req.body;
  try {
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'open') {
      return res.status(400).json({ error: 'Only open orders can be disputed.' });
    }

    const dispute = new Dispute({
      order: order_id,
      initiator: req.user._id,
      reason,
    });

    await dispute.save();
    res.status(201).json(dispute);
  } catch (err) {
    console.error('Error creating dispute:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create dispute' });
    }
  }
});

// Решить арбитраж
router.patch('/:id/resolve', verifyToken, checkRole('moderator'), async (req, res) => {
  const { resolution } = req.body;
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    dispute.resolution = resolution;
    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Обновление статуса ордера
    const order = await Order.findById(dispute.order);
    if (order) {
      order.status = resolution === 'refund' ? 'refunded' : 'completed';
      await order.save();
    }

    res.json(dispute);
  } catch (err) {
    console.error('Error resolving dispute:', err.message);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

// Удаление спора (например, администратором)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const dispute = await Dispute.findByIdAndDelete(req.params.id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    res.status(200).json({ message: 'Dispute deleted successfully.' });
  } catch (err) {
    console.error('Error deleting dispute:', err.message);
    res.status(500).json({ error: 'Failed to delete dispute.' });
  }
});

module.exports = router;