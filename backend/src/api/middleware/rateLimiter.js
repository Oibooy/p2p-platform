const rateLimit = require('express-rate-limit');
const logger = require('../../infrastructure/logger');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../../infrastructure/redisClient');

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
