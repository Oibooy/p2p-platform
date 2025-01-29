const ReviewRepository = require('../../db/repositories/ReviewRepository');
const DealRepository = require('../../db/repositories/DealRepository');
const logger = require('../../infrastructure/logger');
const { AppError, ValidationError } = require('../../infrastructure/errors');

exports.createReview = async (req, res) => {
  try {
    const { dealId, rating, comment } = req.body;
    const fromUserId = req.user.id;

    const dealRepository = new DealRepository();
    const reviewRepository = new ReviewRepository();

    // Проверка существования сделки
    const deal = await dealRepository.findById(dealId);
    if (!deal) {
      throw new ValidationError('Deal not found');
    }

    // Проверка прав на создание отзыва
    if (deal.buyer.toString() !== fromUserId && deal.seller.toString() !== fromUserId) {
      throw new ValidationError('No permission to create review');
    }

    // Проверка на существование отзыва
    const existingReview = await reviewRepository.checkExistingReview(dealId, fromUserId);
    if (existingReview) {
      throw new ValidationError('Review already exists');
    }

    const toUserId = deal.buyer.toString() === fromUserId ? deal.seller : deal.buyer;

    const review = await reviewRepository.create({
      dealId,
      from: fromUserId,
      to: toUserId,
      rating,
      comment
    });

    logger.info({
      event: 'review_created',
      dealId,
      fromUser: fromUserId,
      toUser: toUserId
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in createReview:', error);
    throw new AppError('Failed to create review', 500);
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviewRepository = new ReviewRepository();
    const reviews = await reviewRepository.findByUser(userId);

    const stats = await reviewRepository.getUserStats(userId);
    
    res.json({ reviews, stats });
  } catch (error) {
    logger.error('Error in getUserReviews:', error);
    throw new AppError('Failed to get user reviews', 500);
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const reviewRepository = new ReviewRepository();
    const review = await reviewRepository.findById(id);
    
    if (!review) {
      throw new ValidationError('Review not found');
    }

    if (review.from.toString() !== userId) {
      throw new ValidationError('No permission to edit review');
    }

    const updatedReview = await reviewRepository.update(id, { rating, comment });
    res.json(updatedReview);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in updateReview:', error);
    throw new AppError('Failed to update review', 500);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reviewRepository = new ReviewRepository();
    const review = await reviewRepository.findById(id);

    if (!review) {
      throw new ValidationError('Review not found');
    }

    if (review.from.toString() !== userId) {
      throw new ValidationError('No permission to delete review');
    }

    await reviewRepository.delete(id);
    logger.info({
      event: 'review_deleted',
      reviewId: id,
      userId
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in deleteReview:', error);
    throw new AppError('Failed to delete review', 500);
  }
};
