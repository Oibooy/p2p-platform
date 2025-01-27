const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const router = express.Router();

// Получение отзывов пользователя
router.get('/:userId', async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

  try {
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ to: req.params.userId })
      .populate('from', 'username')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ to: req.params.userId });
    const averageRating = await Review.aggregate([
      { $match: { to: mongoose.Types.ObjectId(req.params.userId) } },
      { $group: { _id: null, average: { $avg: '$rating' } } },
    ]);

    res.json({
      reviews,
      total: totalReviews,
      averageRating: averageRating.length ? averageRating[0].average.toFixed(1) : 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Создание отзыва
router.post('/', verifyToken, async (req, res) => {
  const { dealId, to, rating, comment } = req.body;

  try {
    const order = await Order.findById(dealId);
    if (!order || order.status !== 'closed') {
      return res.status(400).json({ error: 'Only completed orders can be reviewed.' });
    }

    const existingReview = await Review.findOne({ dealId, from: req.user.userId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this deal.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const review = new Review({
      dealId,
      from: req.user.userId,
      to,
      rating,
      comment,
    });

    await review.save();

    // Обновление статистики пользователя
    const user = await User.findById(to);
    if (user) {
      user.reviewsCount = (user.reviewsCount || 0) + 1;
      user.totalRating = (user.totalRating || 0) + rating;
      user.save();
    }

    res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (error) {
    console.error('Error creating review:', error.message);
    res.status(500).json({ error: 'Failed to create review.' });
  }
});

// Редактирование отзыва
router.patch('/:id', verifyToken, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.from.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this review.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    res.status(200).json({ message: 'Review updated successfully.', review });
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ error: 'Failed to update review.' });
  }
});

// Удаление отзыва
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.from.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this review.' });
    }

    await review.remove();
    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Review = require('../models/Review');

// Create review
router.post('/', verifyToken, async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      reviewer: req.user._id
    });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
