// Message.js - Модель сообщений
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true }, // Ссылка на сделку
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Отправитель
    content: { type: String, required: true }, // Текст сообщения
    isModerated: { type: Boolean, default: false }, // Статус модерации
  },
  { timestamps: true }
);

// Индексация для ускорения поиска
messageSchema.index({ deal: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);