const axios = require('axios');
const crypto = require('crypto');
const logger = require('../infrastructure/logger');
const redisClient = require('../infrastructure/redisClient');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

class WebhookService {
    /**
     * 📌 Отправка вебхука с повторными попытками
     */
    async sendWebhook(url, event, payload, retries = MAX_RETRIES) {
        try {
            const signature = this.generateSignature(payload);
            for (let i = 0; i < retries; i++) {
                try {
                    await axios.post(url, payload, {
                        headers: { 'X-Signature': signature }
                    });
                    logger.info(`✅ Вебхук отправлен: ${event} → ${url}`);
                    return;
                } catch (error) {
                    logger.warn(`🚨 Ошибка отправки вебхука (попытка ${i + 1}): ${error.message}`);
                    if (i < retries - 1) await new Promise(res => setTimeout(res, RETRY_DELAY));
                }
            }
            throw new Error('Ошибка отправки вебхука после всех попыток');
        } catch (error) {
            logger.error(`❌ Ошибка вебхука (${event}): ${error.message}`);
        }
    }

    /**
     * 📌 Валидация входящего вебхука
     */
    validateWebhook(signature, payload) {
        const expectedSignature = this.generateSignature(payload);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }

    /**
     * 📌 Генерация подписи HMAC
     */
    generateSignature(payload) {
        return crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex');
    }
}

module.exports = new WebhookService();
