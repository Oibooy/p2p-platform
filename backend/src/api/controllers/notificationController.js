// src/api/controllers/notificationController.js (Рефакторинг)
const express = require('express');
const router = express.Router();
const notificationService = require('../../core/services/notificationService');
const logger = require('../../infrastructure/logger');

// Отправка уведомления пользователю через Telegram Mini App
router.post('/send', async (req, res) => {
    try {
        const { userId, message } = req.body;
        
        await notificationService.sendTelegramNotification(userId, message);
        logger.info(`Notification sent to user ${userId}`);
        
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`Notification error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Получение всех уведомлений пользователя
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const notifications = await notificationService.getUserNotifications(userId);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        logger.error(`Fetch notifications error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;