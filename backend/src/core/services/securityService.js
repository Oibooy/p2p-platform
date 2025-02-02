// src/core/services/securityService.js (Рефакторинг + защита данных)
const crypto = require('crypto');
const logger = require('./loggingService');

class SecurityService {
    static hashData(data) {
        try {
            const hash = crypto.createHash('sha256').update(data).digest('hex');
            return hash;
        } catch (error) {
            logger.logError(`Hashing error: ${error.message}`);
            throw error;
        }
    }

    static encryptData(data, secretKey) {
        try {
            const cipher = crypto.createCipher('aes-256-cbc', secretKey);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (error) {
            logger.logError(`Encryption error: ${error.message}`);
            throw error;
        }
    }

    static decryptData(encryptedData, secretKey) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            logger.logError(`Decryption error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SecurityService;