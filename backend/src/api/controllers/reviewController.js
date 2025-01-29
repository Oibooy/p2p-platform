
const ReviewRepository = require('../../db/repositories/ReviewRepository');
const DealRepository = require('../../db/repositories/DealRepository');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

exports.createReview = async (req, res) => {
  try {
    const { dealId, rating, comment } = req.body;
    const fromUserId = req.user.id;

    const dealRepository = new DealRepository();
    const deal = await dealRepository.findById(dealId);
    if (!deal) {
      throw new AppError('Сделка не найдена', 404);
    }

    if (deal.buyer.toString() !== fromUserId && deal.seller.toString() !== fromUserId) {
      throw new AppError('Нет прав для создания отзыва', 403);
    }

    const toUserId = deal.buyer.toString() === fromUserId ? deal.seller : deal.buyer;

    const reviewRepository = new ReviewRepository();
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
    logger.error('Error in createReview:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при создании отзыва' });
    }
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviewRepository = new ReviewRepository();
    const reviews = await reviewRepository.findByUserId(userId);

    res.json(reviews);
  } catch (error) {
    logger.error('Error in getUserReviews:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
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
      throw new AppError('Отзыв не найден', 404);
    }

    if (review.from.toString() !== userId) {
      throw new AppError('Нет прав для редактирования отзыва', 403);
    }

    const updatedReview = await reviewRepository.update(id, { rating, comment });
    res.json(updatedReview);
  } catch (error) {
    logger.error('Error in updateReview:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при обновлении отзыва' });
    }
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reviewRepository = new ReviewRepository();
    const review = await reviewRepository.findById(id);

    if (!review) {
      throw new AppError('Отзыв не найден', 404);
    }

    if (review.from.toString() !== userId) {
      throw new AppError('Нет прав для удаления отзыва', 403);
    }

    await reviewRepository.delete(id);
    logger.info({
      event: 'review_deleted',
      reviewId: id,
      userId
    });

    res.json({ message: 'Отзыв успешно удален' });
  } catch (error) {
    logger.error('Error in deleteReview:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при удалении отзыва' });
    }
  }
};
