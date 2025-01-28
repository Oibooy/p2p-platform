// Order model schema implementation
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true }, // Тип ордера: покупка или продажа
  amount: { type: Number, required: true }, // Сумма сделки
  price: { type: Number, required: true },  // Цена за единицу
  status: { type: String, enum: ['open', 'closed', 'dispute'], default: 'open' }, // Добавлено значение 'dispute'
  expiresAt: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiration time must be in the future'
    }
  },
  dispute: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', default: null }, // Связь с арбитражем
}, { timestamps: true });

// Индексы для ускорения поиска
OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ type: 1, status: 1 });
OrderSchema.index({ expiresAt: 1 });

// Создание нового ордера
OrderSchema.statics.createOrder = async function(orderData) {
  return this.create(orderData);
};

// Поиск активных ордеров
OrderSchema.statics.findActiveOrders = async function(filters = {}) {
  return this.find({
    ...filters,
    status: 'open',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'username');
};

// Обновление статуса ордера
OrderSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Проверка срока действия ордера
OrderSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Получение ордеров пользователя
OrderSchema.statics.getUserOrders = async function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', OrderSchema);
