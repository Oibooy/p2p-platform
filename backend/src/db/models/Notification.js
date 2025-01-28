// Notification.js - Модель уведомлений
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Кому адресовано уведомление
    event: { type: String, required: true }, // Тип события
    data: { type: Object, required: true }, // Дополнительные данные
    isRead: { type: Boolean, default: false }, // Прочитано или нет
  },
  { timestamps: true }
);

// Индексация для ускорения поиска
notificationSchema.index({ user: 1 });

// Создание нового уведомления
notificationSchema.statics.createNotification = async function(userId, event, data) {
  return this.create({
    user: userId,
    event: event,
    data: data
  });
};

// Получение непрочитанных уведомлений пользователя
notificationSchema.statics.getUserUnreadNotifications = async function(userId) {
  return this.find({ 
    user: userId,
    isRead: false 
  }).sort({ createdAt: -1 });
};

// Отметить уведомление как прочитанное
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

// Отметить все уведомления пользователя как прочитанные
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);