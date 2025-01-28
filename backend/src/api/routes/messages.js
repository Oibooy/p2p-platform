// routes/messages.js - Маршруты для модерации чатов
const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');
const { validateMessage } = require('../validators/validation');
const Message = require('../../db/models/Message');
const Deal = require('../../db/models/Deal');

const router = express.Router();

// Получение всех сообщений сделки (только для модераторов)
router.get('/deal/:dealId', verifyToken,  async (req, res) => {
  try {
    const messages = await Message.find({ deal: req.params.dealId }).populate('sender', 'username');
    if (!messages.length) {
      return res.status(404).json({ error: 'Сообщения не найдены' });
    }
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Пометка сообщения как отмодерированного
router.patch('/:id/moderate', verifyToken,  async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    message.isModerated = true;
    await message.save();

    res.status(200).json({ message: 'Сообщение отмодерировано', moderatedMessage: message });
  } catch (error) {
    console.error('Error moderating message:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление сообщения (только для модераторов)
router.delete('/:id', verifyToken,  async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    res.status(200).json({ message: 'Сообщение удалено' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;