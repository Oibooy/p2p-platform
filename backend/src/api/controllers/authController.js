// src/api/controllers/authController.js (Рефакторинг)
const express = require('express');
const router = express.Router();
const authService = require('../../core/services/authService');
const logger = require('../../infrastructure/logger');

// Авторизация через Telegram
router.post('/telegram', async (req, res) => {
    try {
        const { telegramData } = req.body;
        
        const user = await authService.authenticateTelegramUser(telegramData);
        logger.info(`User ${user.id} authenticated via Telegram`);
        
        res.status(200).json({ success: true, user });
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Выход из системы
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;
        await authService.logout(userId);
        logger.info(`User ${userId} logged out`);
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;