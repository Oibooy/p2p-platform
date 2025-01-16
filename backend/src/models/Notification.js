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

module.exports = mongoose.model('Notification', notificationSchema);