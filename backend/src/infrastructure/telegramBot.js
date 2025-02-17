const axios = require('axios');
const logger = require('./logger');
const messageQueue = require('./messageQueue');

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

const sendMessage = async (userId, message) => {
    try {
        const response = await axios.post(TELEGRAM_API_URL, {
            chat_id: userId,
            text: message,
            parse_mode: 'Markdown'
        });
        logger.info(`✅ Telegram сообщение отправлено: ${message} → ${userId}`);
        return response.data;
    } catch (error) {
        logger.warn(`⚠️ Ошибка отправки Telegram сообщения: ${error.response?.data?.description || error.message}`);
        await messageQueue.publish('failed_notifications', { userId, message });
    }
};

module.exports = { sendMessage };
