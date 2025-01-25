const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['pending', 'funded', 'completed', 'refunded', 'disputed', 'expired'],
      default: 'pending',
    },
    deadline: {
      type: Date,
      required: true,
    },
    smartContractId: {
      type: String, required: false },
    screenshot: { type: String, required: false }, // Скриншот перевода
    history: [
      {
        status: {
          type: String,
          enum: ['pending', 'funded', 'completed', 'refunded', 'disputed', 'expired'],
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // Для автоматического создания createdAt и updatedAt
  }
);

// Индексы для ускорения запросов
dealSchema.index({ buyer: 1 });
dealSchema.index({ seller: 1 });
dealSchema.index({ status: 1 });
dealSchema.index({ deadline: 1 });

// Добавление статуса в историю с валидацией перехода статусов
dealSchema.methods.addStatusToHistory = async function (newStatus) {
  const validTransitions = {
    pending: ['funded', 'expired'],
    funded: ['completed', 'refunded', 'disputed'],
    completed: [],
    refunded: [],
    disputed: ['resolved'],
    expired: [],
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Нельзя перейти из статуса ${this.status} в ${newStatus}`);
  }

  this.history.push({ status: newStatus });
  this.status = newStatus;
  await this.save();
};

// Проверка истечения срока сделки и автоматическое обновление статуса
dealSchema.methods.checkAndExpire = async function () {
  if (this.isExpired()) {
    this.status = 'expired';
    this.history.push({ status: 'expired' });
    await this.save();
  }
};

// Проверка истечения срока сделки
dealSchema.methods.isExpired = function () {
  return Date.now() > new Date(this.deadline).getTime();
};

// Получение информации о сделке
dealSchema.statics.getDealDetails = async function (dealId) {
  return this.findById(dealId).populate('buyer', 'username').populate('seller', 'username');
};

// Создание новой сделки
dealSchema.statics.createDeal = async function (buyerId, sellerId, amount, deadline) {
  return this.create({
    buyer: buyerId,
    seller: sellerId,
    amount: amount,
    deadline: deadline,
    status: 'pending'
  });
};

// Получение активных сделок пользователя
dealSchema.statics.getUserActiveDeals = async function (userId) {
  return this.find({
    $or: [{ buyer: userId }, { seller: userId }],
    status: { $in: ['pending', 'funded', 'disputed'] }
  }).populate('buyer seller', 'username');
};

// Обновление статуса сделки
dealSchema.methods.updateStatus = async function (newStatus) {
  if (this.status === newStatus) return this;
  
  await this.addStatusToHistory(newStatus);
  return this;
};

// Метод для проверки возможности действия
dealSchema.methods.canPerformAction = function (action, userId) {
  const actions = {
    fund: () => this.status === 'pending' && this.buyer.toString() === userId.toString(),
    complete: () => this.status === 'funded' && this.buyer.toString() === userId.toString(),
    dispute: () => this.status === 'funded' && 
      (this.buyer.toString() === userId.toString() || this.seller.toString() === userId.toString())
  };
  
  return actions[action] ? actions[action]() : false;
};

module.exports = mongoose.model('Deal', dealSchema);

