// src/core/middleware/authMiddleware.js (Финальная оптимизация + Улучшенное логирование, мониторинг и документация API)
const jwt = require('jsonwebtoken');
const logger = require('../services/loggingService');
const metrics = require('../services/metricsService');
const config = require('../../config');
const { body, validationResult } = require('express-validator');
const cache = require('../services/cacheService');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

/**
 * Middleware для аутентификации пользователей по JWT-токену
 */
const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            throw new Error('Access denied. No token provided');
        }
        const decoded = jwt.verify(token.replace('Bearer ', ''), config.JWT_SECRET);
        req.user = decoded;
        metrics.increment('authentication.success');
        next();
    } catch (error) {
        logger.logError(`Authentication error: ${error.message}`);
        metrics.increment('authentication.failure');
        next({ status: 401, message: 'Доступ запрещен. Недействительный или отсутствующий токен' });
    }
};

/**
 * Middleware для авторизации пользователей по ролям
 */
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

/**
 * Middleware для валидации входных данных
 */
const validateInput = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            metrics.increment('validation.failure');
            return next({ status: 400, message: 'Ошибка валидации', errors: errors.array() });
        }
        metrics.increment('validation.success');
        next();
    };
};

/**
 * Middleware для защиты API (CORS, Helmet, XSS)
 */
const securityMiddleware = (app) => {
    app.use(helmet());
    app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
    app.use(xss());
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Ограничение запросов
};

/**
 * Middleware для кэширования API-ответов
 */
const cacheMiddleware = (keyGenerator, ttl = 60) => {
    return async (req, res, next) => {
        const key = keyGenerator(req);
        const cachedData = await cache.get(key);
        if (cachedData) {
            metrics.increment('cache.hit');
            return res.status(200).json(JSON.parse(cachedData));
        }
        metrics.increment('cache.miss');
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, JSON.stringify(body), ttl);
            res.sendResponse(body);
        };
        next();
    };
};

/**
 * Middleware для постраничного вывода данных
 */
const paginateResults = (model) => {
    return async (req, res, next) => {
        const { page = 1, limit = 10 } = req.query;
        const startIndex = (page - 1) * limit;
        const totalDocs = await model.countDocuments().exec();
        const results = {
            next: endIndex < totalDocs ? { page: parseInt(page) + 1, limit: parseInt(limit) } : null,
            previous: startIndex > 0 ? { page: parseInt(page) - 1, limit: parseInt(limit) } : null,
            results: await model.find().lean().limit(parseInt(limit)).skip(startIndex).exec()
        };
        res.paginatedResults = results;
        next();
    };
};

/**
 * Функция для управления транзакциями в MongoDB
 */
const runTransaction = async (operations) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await operations(session);
        await session.commitTransaction();
        session.endSession();
        metrics.increment('transaction.success');
        return result;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.logError(`Transaction error: ${error.message}`);
        metrics.increment('transaction.failure');
        throw error;
    }
};

/**
 * Глобальный обработчик ошибок
 */
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    logger.logError(`API Error: ${err.message}`);
    metrics.increment('errors.count');
    res.status(status).json({ success: false, message: err.message, errors: err.errors || [] });
};

module.exports = { authenticate, authorize, validateInput, securityMiddleware, cacheMiddleware, paginateResults, runTransaction, errorHandler, body };