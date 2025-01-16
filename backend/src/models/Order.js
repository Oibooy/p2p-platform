// Order model schema implementation
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true }, // Тип ордера: покупка или продажа
  amount: { type: Number, required: true }, // Сумма сделки
  price: { type: Number, required: true },  // Цена за единицу
  status: { type: String, enum: ['open', 'closed', 'dispute'], default: 'open' }, // Добавлено значение 'dispute'
  expiresAt: { type: Date, required: true }, // Таймер для сделки
  dispute: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', default: null }, // Связь с арбитражем
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
