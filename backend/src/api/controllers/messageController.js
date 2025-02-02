// src/api/controllers/messageController.js (Рефакторинг)
const express = require('express');
const router = express.Router();
const messageService = require('../../core/services/messageService');
const logger = require('../../infrastructure/logger');

// Отправка сообщения между пользователями
router.post('/send', async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;

        const message = await messageService.sendMessage(senderId, receiverId, content);
        logger.info(`Message sent from ${senderId} to ${receiverId}`);

        res.status(200).json({ success: true, message });
    } catch (error) {
        logger.error(`Message sending error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Получение истории сообщений между пользователями
router.get('/history/:userId/:contactId', async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        const messages = await messageService.getMessageHistory(userId, contactId);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        logger.error(`Message history fetch error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;