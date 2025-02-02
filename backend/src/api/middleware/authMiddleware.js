const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../services/loggingService');
const metrics = require('../services/metricsService');

const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            throw new Error('Access denied. No token provided');
        }

        const decoded = jwt.verify(token.replace('Bearer ', ''), config.JWT_SECRET);

        // Проверяем, что IP и User-Agent соответствуют токену
        if (decoded.ip !== req.ip || decoded.userAgent !== req.headers['user-agent']) {
            logger.logWarn(`Session invalid for user ${decoded.id}, possible token misuse`);
            metrics.increment('authentication.session_invalid');
            return next({ status: 403, message: 'Сессия недействительна, выполните повторный вход' });
        }

        req.user = decoded;
        metrics.increment('authentication.success');
        next();
    } catch (error) {
        logger.logError(`Authentication error: ${error.message}`);
        metrics.increment('authentication.failure');
        next({ status: 401, message: 'Доступ запрещен. Недействительный или отсутствующий токен' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.logWarn(`Access denied. User role: ${req.user ? req.user.role : 'Unknown'}`);
            metrics.increment('authorization.failure');
            return next({ status: 403, message: 'Доступ запрещен. Недостаточно прав' });
        }
        metrics.increment('authorization.success');
        next();
    };
};

module.exports = { authenticate, authorize };


