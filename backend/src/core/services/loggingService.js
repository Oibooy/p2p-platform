// src/core/services/loggingService.js (Рефакторинг + расширенный мониторинг)
const winston = require('winston');
const { createLogger, format, transports } = winston;
const metrics = require('../../infrastructure/metrics');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/application.log' })
    ]
});

class LoggingService {
    static logInfo(message, meta = {}) {
        logger.info(message, meta);
        metrics.increment('logs.info');
    }

    static logError(message, meta = {}) {
        logger.error(message, meta);
        metrics.increment('logs.error');
    }

    static logWarn(message, meta = {}) {
        logger.warn(message, meta);
        metrics.increment('logs.warn');
    }
}

module.exports = LoggingService;