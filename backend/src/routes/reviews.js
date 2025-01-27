const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().populate('user', 'username');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/', verifyToken, async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      from: req.user.id
    });
    return res.status(201).json({ review });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;