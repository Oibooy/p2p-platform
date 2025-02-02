// src/core/services/messagingService.js (Рефакторинг + управление сообщениями)
const { MessageRepository } = require('../../db/repositories/MessageRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');
const telegramBot = require('../../infrastructure/telegramBot');

class MessagingService {
    constructor() {
        this.messageRepository = new MessageRepository();
    }

    async sendMessage(senderId, receiverId, content) {
        try {
            logger.info(`Sending message from ${senderId} to ${receiverId}`);
            
            const message = await this.messageRepository.create({ senderId, receiverId, content });
            await telegramBot.sendMessage(receiverId, content);
            
            metrics.increment('messages.sent');
            return message;
        } catch (error) {
            logger.error(`Message sending error: ${error.message}`);
            throw error;
        }
    }

    async getMessageHistory(userId, contactId) {
        try {
            const messages = await this.messageRepository.findByUsers(userId, contactId);
            return messages;
        } catch (error) {
            logger.error(`Fetch message history error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new MessagingService();