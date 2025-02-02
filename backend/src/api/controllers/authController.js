// src/api/controllers/authController.js
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../../core/services/loggingService');

/**
 * Генерирует JWT-токен для пользователя
 */
const generateJwtToken = (userId, role) => {
    return jwt.sign({ userId, role }, config.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Обрабатывает аутентификацию через Telegram OAuth
 */
const telegramAuth = async (req, res) => {
    try {
        const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

        // Проверяем валидность данных Telegram (защита от подмены)
        const isValid = await validateTelegramData(req.body);
        if (!isValid) {
            return res.status(403).json({ message: 'Invalid Telegram data' });
        }

        // Проверяем, существует ли пользователь
        let user = await UserRepository.findByTelegramId(id);
        if (!user) {
            // Создаем нового пользователя
            user = await UserRepository.create({
                telegramId: id,
                firstName: first_name,
                lastName: last_name,
                username,
                photoUrl: photo_url,
                role: 'USER', // По умолчанию
                balance: { MTT: 0, USDT: 0 }
            });
        }

        // Генерируем JWT-токен
        const token = generateJwtToken(user._id, user.role);
        return res.json({ token, user });
    } catch (error) {
        logger.logError(`Telegram Auth Error: ${error.message}`);
        return res.status(500).json({ message: 'Authentication failed' });
    }
};

/**
 * Валидация данных Telegram (SHA256-подпись)
 */
const validateTelegramData = async (data) => {
    const secret = require('crypto').createHmac('sha256', config.TELEGRAM_BOT_TOKEN).digest();
    const hash = data.hash;
    delete data.hash;

    const sortedData = Object.keys(data).sort().map(key => `${key}=${data[key]}`).join('\n');
    const calculatedHash = require('crypto').createHmac('sha256', secret).update(sortedData).digest('hex');

    return hash === calculatedHash;
};

module.exports = { telegramAuth };