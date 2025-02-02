// src/core/services/notificationService.js (Рефакторинг + управление уведомлениями)
const { NotificationRepository } = require('../../db/repositories/NotificationRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');
const telegramBot = require('../../infrastructure/telegramBot');

class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
    }

    async sendNotification(userId, message) {
        try {
            logger.info(`Sending notification to user ${userId}`);

            const notification = await this.notificationRepository.create({ userId, message });
            await telegramBot.sendMessage(userId, message);

            metrics.increment('notifications.sent');
            return notification;
        } catch (error) {
            logger.error(`Notification error: ${error.message}`);
            throw error;
        }
    }

    async getUserNotifications(userId) {
        try {
            const notifications = await this.notificationRepository.findByUserId(userId);
            return notifications;
        } catch (error) {
            logger.error(`Fetch notifications error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();