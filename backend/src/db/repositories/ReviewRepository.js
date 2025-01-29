
const BaseRepository = require('./BaseRepository');
const Review = require('../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByUser(userId) {
    return this.find({ to: userId })
      .populate('from', 'username')
      .populate('dealId')
      .sort({ createdAt: -1 });
  }

  async checkExistingReview(dealId, fromUserId) {
    return this.findOne({ dealId, from: fromUserId });
  }

  async getUserRating(userId) {
    const reviews = await this.find({ to: userId });
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  }
}

module.exports = new ReviewRepository();
