const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' },
  from: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  rating: { 
    type: Number, 
    required: true, 
    min: [1, 'Rating must be at least 1'], 
    max: [5, 'Rating cannot be more than 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  comment: { 
    type: String, 
    default: '',
    maxlength: [500, 'Comment cannot be longer than 500 characters']
  },
}, { timestamps: true });

// Индексы для оптимизации
ReviewSchema.index({ dealId: 1 });
ReviewSchema.index({ from: 1, to: 1 });
ReviewSchema.index({ rating: -1 });

// Метод для проверки существования отзыва
ReviewSchema.statics.checkExistingReview = async function(dealId, fromUserId) {
  return await this.findOne({ dealId, from: fromUserId });
};

module.exports = mongoose.model('Review', ReviewSchema);
