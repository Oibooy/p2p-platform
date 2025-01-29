const express = require('express');
const { verifyToken, isModerator, validateRequest } = require('../middleware');
const { validateDispute } = require('../validators/disputeValidator');
const disputeController = require('../controllers/disputeController');

// Получение списка споров (только для модераторов)
router.get('/', verifyToken, isModerator, async (req, res) => {
  try {
    const disputes = await disputeController.getAllDisputes(req.query);
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// Получение конкретного спора
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const dispute = await disputeController.getDisputeById(req.params.id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

// Создать арбитраж
router.post('/', verifyToken, validateDispute, async (req, res) => {
  try {
    const dispute = await disputeController.createDispute(req.body, req.user._id);
    res.status(201).json(dispute);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to create dispute' });
  }
});

// Решить арбитраж
router.patch('/:id/resolve', verifyToken, isModerator, async (req, res) => {
  try {
    const dispute = await disputeController.resolveDispute(req.params.id, req.body.resolution);
    res.json(dispute);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to resolve dispute' });
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