const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' }, // ID сделки
  from: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Кто оставил отзыв
  to: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Кому оставили отзыв
  rating: { type: Number, required: true, min: 1, max: 5 }, // Рейтинг (от 1 до 5)
  comment: { type: String, default: '' }, // Текстовый комментарий
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
