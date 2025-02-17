const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../../infrastructure/logger');
const redisClient = require('../../infrastructure/redisClient');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Нет токена, доступ запрещён' });
        }

        const decoded = jwt.verify(token.replace('Bearer ', ''), config.jwt_secret);

        // Проверяем, заблокирован ли токен в Redis (например, после выхода пользователя)
        const isBlacklisted = await redisClient.get(`blacklist:${decoded.id}`);
        if (isBlacklisted) {
            return res.status(403).json({ success: false, message: 'Токен недействителен, выполните повторный вход' });
        }

        // Проверяем IP и User-Agent, чтобы предотвратить кражу сессии
        if (decoded.ip !== req.ip || decoded.userAgent !== req.headers['user-agent']) {
            logger.warn(`🚨 Подозрительная сессия для пользователя ${decoded.id}, возможное использование токена`);
            return res.status(403).json({ success: false, message: 'Сессия недействительна, выполните повторный вход' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`❌ Ошибка аутентификации: ${error.message}`);
        return res.status(401).json({ success: false, message: 'Недействительный или истёкший токен' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.warn(`🚫 Доступ запрещён: ${req.user ? req.user.role : 'Неизвестный пользователь'}`);
            return res.status(403).json({ success: false, message: 'Недостаточно прав' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
