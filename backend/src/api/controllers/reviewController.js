
const Review = require('../../db/models/Review');
const Deal = require('../../db/models/Deal');
const logger = require('../../infrastructure/logger');

// Создание нового отзыва
exports.createReview = async (req, res) => {
  try {
    const { dealId, rating, comment } = req.body;
    const fromUserId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Проверяем, что пользователь участвовал в сделке
    if (deal.buyer.toString() !== fromUserId && deal.seller.toString() !== fromUserId) {
      return res.status(403).json({ error: 'Нет прав для создания отзыва' });
    }

    // Определяем получателя отзыва
    const toUserId = deal.buyer.toString() === fromUserId ? deal.seller : deal.buyer;

    const review = await Review.create({
      dealId,
      from: fromUserId,
      to: toUserId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    logger.error('Error in createReview:', error);
    res.status(500).json({ error: 'Ошибка при создании отзыва' });
  }
};

// Получение отзывов пользователя
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviews = await Review.find({ to: userId })
      .populate('from', 'username')
      .populate('dealId');
    
    res.json(reviews);
  } catch (error) {
    logger.error('Error in getUserReviews:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

// Обновление отзыва
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    if (review.from.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для редактирования отзыва' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.json(review);
  } catch (error) {
    logger.error('Error in updateReview:', error);
    res.status(500).json({ error: 'Ошибка при обновлении отзыва' });
  }
};

// Удаление отзыва
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    if (review.from.toString() !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления отзыва' });
    }

    await review.remove();
    res.json({ message: 'Отзыв успешно удален' });
  } catch (error) {
    logger.error('Error in deleteReview:', error);
    res.status(500).json({ error: 'Ошибка при удалении отзыва' });
  }
};
