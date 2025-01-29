const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const ReviewRepository = require('../../db/repositories/ReviewRepository');
const { validateReview } = require('../validators/validation'); // Added this line

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await ReviewRepository.find().populate('user', 'username');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/', verifyToken, validateReview, async (req, res) => { // Added validateReview middleware
  try {
    const review = await ReviewRepository.create({
      ...req.body,
      from: req.user.id
    });
    return res.status(201).json({ review });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get reviews by user ID
router.get('/:userId', async (req, res) => {
  try {
    const reviews = await ReviewRepository.find({ to: req.params.userId });
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;