const { NotificationRepository } = require('../../db/repositories/NotificationRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');
const telegramBot = require('../../infrastructure/telegramBot');
const WebSocketServer = require('../../infrastructure/webSocketServer');
const messageQueue = require('../../infrastructure/messageQueue');

class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
    }

    async sendNotification(userId, message) {
        try {
            logger.info(`📢 Sending notification to user ${userId}`);

            const notification = await this.notificationRepository.create({ userId, message });
            metrics.increment('notifications.sent');

            // WebSocket уведомления
            WebSocketServer.sendToUser(userId, { type: 'notification', message });

            // Отправка в очередь сообщений для масштабируемости
            await messageQueue.publish('notifications', { userId, message });

            // Попытка отправить через Telegram
            try {
                await telegramBot.sendMessage(userId, message);
            } catch (error) {
                logger.warn(`⚠️ Telegram отправка не удалась: ${error.message}`);
            }

            return notification;
        } catch (error) {
            logger.error(`❌ Ошибка отправки уведомления: ${error.message}`);
            throw error;
        }
    }

    async getUserNotifications(userId) {
        try {
            return await this.notificationRepository.findByUserId(userId);
        } catch (error) {
            logger.error(`❌ Ошибка получения уведомлений: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();
