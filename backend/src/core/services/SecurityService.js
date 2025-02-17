const crypto = require('crypto');
const logger = require('./loggingService');

class SecurityService {
    static hashData(data) {
        try {
            return crypto.createHash('sha256').update(data).digest('hex');
        } catch (error) {
            logger.logError(`Hashing error: ${error.message}`);
            throw error;
        }
    }

    static signData(data, secretKey) {
        try {
            return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
        } catch (error) {
            logger.logError(`Signing error: ${error.message}`);
            throw error;
        }
    }

    static encryptData(data, secretKey) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + encrypted;
        } catch (error) {
            logger.logError(`Encryption error: ${error.message}`);
            throw error;
        }
    }

    static decryptData(encryptedData, secretKey) {
        try {
            const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
            const encryptedText = encryptedData.slice(32);
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            logger.logError(`Decryption error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SecurityService;
