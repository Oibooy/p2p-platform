const express = require('express');
const router = express.Router();
const { verifyToken, isModerator, validateRequest } = require('../middleware');
const { createDisputeValidator, resolveDisputeValidator } = require('../validators/disputeValidator');
const disputeController = require('../controllers/disputeController');
const { asyncHandler } = require('../middleware');

// Get all disputes (moderators only)
router.get('/', 
  verifyToken, 
  isModerator, 
  asyncHandler(disputeController.getAllDisputes)
);

// Get specific dispute
router.get('/:id', 
  verifyToken, 
  asyncHandler(disputeController.getDisputeDetails)
);

// Create dispute
router.post('/',
  verifyToken,
  createDisputeValidator,
  validateRequest,
  asyncHandler(disputeController.createDispute)
);

// Resolve dispute
router.patch('/:id/resolve',
  verifyToken,
  isModerator,
  resolveDisputeValidator,
  validateRequest,
  asyncHandler(disputeController.resolveDispute)
);

// Delete dispute (admin only)
router.delete('/:id',
  verifyToken,
  checkRole('admin'),
  asyncHandler(async (req, res) => {
    const dispute = await disputeController.deleteDispute(req.params.id);
    res.status(200).json({ message: 'Dispute deleted successfully' });
  })
);

module.exports = router;