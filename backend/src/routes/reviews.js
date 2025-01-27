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
router.post('/', async (req, res) => {
  try {
    const { dealId, rating, comment, to } = req.body;
    const review = new Review({
      deal: dealId,
      rating,
      comment,
      to
    });
    const savedReview = await review.save();
    res.status(201).json({ review: savedReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  try {
    const { orderId, rating, comment } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.seller.toString() !== req.user.userId && 
        order.buyer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to review this order' });
    }

    const review = new Review({
      order: orderId,
      user: req.user.userId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;