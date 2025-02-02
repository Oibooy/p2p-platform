// src/core/services/userService.js (Рефакторинг + управление пользователями)
const { UserRepository } = require('../../db/repositories/UserRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(telegramId, username) {
        try {
            logger.info(`Creating user: ${username} with Telegram ID: ${telegramId}`);
            
            const existingUser = await this.userRepository.findByTelegramId(telegramId);
            if (existingUser) {
                logger.warn(`User with Telegram ID ${telegramId} already exists`);
                return existingUser;
            }
            
            const user = await this.userRepository.create({ telegramId, username });
            metrics.increment('users.created');
            return user;
        } catch (error) {
            logger.error(`User creation error: ${error.message}`);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) throw new Error('User not found');
            
            return user;
        } catch (error) {
            logger.error(`Fetch user error: ${error.message}`);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            logger.info(`Updating user ${userId}`);
            
            const updatedUser = await this.userRepository.update(userId, updateData);
            metrics.increment('users.updated');
            return updatedUser;
        } catch (error) {
            logger.error(`Update user error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new UserService();