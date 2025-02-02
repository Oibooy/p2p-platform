const rateLimit = require('express-rate-limit');
const logger = require('../../infrastructure/logger');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../../infrastructure/redisClient');

// src/core/middleware/rateLimiter.js (Рефакторинг + контроль доступа и лимит запросов)
const rateLimit = require('express-rate-limit');
const logger = require('../services/loggingService');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // Ограничение 100 запросов на IP
    message: 'Слишком много запросов с этого IP, попробуйте позже',
    handler: (req, res, next) => {
        logger.logWarn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: 'Слишком много запросов, попробуйте позже' });
    }
});

module.exports = limiter;

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max, 
    message: { error: message },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      throw new RateLimitError('Too many requests, please try again later');
    }
  });
};

const apiLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later');
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts, please try again later');
const forgotPasswordLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Too many password reset requests, please try again later.');
const resetPasswordLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Too many password reset requests, please try again later.');
const confirmEmailLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Too many email confirmation requests, please try again later');
const resendConfirmationLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Too many resend confirmation requests, please try again later.');

module.exports = { apiLimiter, authLimiter, forgotPasswordLimiter, resetPasswordLimiter, confirmEmailLimiter, resendConfirmationLimiter };
