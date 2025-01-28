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

// Создание нового сообщения
messageSchema.statics.createMessage = async function(dealId, senderId, content) {
  return this.create({
    deal: dealId,
    sender: senderId,
    content: content
  });
};

// Получение сообщений сделки
messageSchema.statics.getDealMessages = async function(dealId) {
  return this.find({ deal: dealId })
    .populate('sender', 'username')
    .sort({ createdAt: 1 });
};

// Модерация сообщения
messageSchema.methods.moderate = async function() {
  this.isModerated = true;
  return this.save();
};

// Получение непромодерированных сообщений
messageSchema.statics.getUnmoderatedMessages = async function() {
  return this.find({ isModerated: false })
    .populate('deal')
    .populate('sender', 'username');
};

module.exports = mongoose.model('Message', messageSchema);