const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../../infrastructure/redisClient');
const logger = require('../../infrastructure/logger');

const RATE_LIMITS = {
  guest: { windowMs: 15 * 60 * 1000, max: 50 },  // 50 запросов за 15 минут
  user: { windowMs: 15 * 60 * 1000, max: 200 },  // 200 запросов за 15 минут
  admin: { windowMs: 15 * 60 * 1000, max: 1000 } // 1000 запросов за 15 минут
};

const rateLimiter = (req, res, next) => {
  const role = req.user?.role || 'guest';
  const { windowMs, max } = RATE_LIMITS[role] || RATE_LIMITS.guest;

  return rateLimit({
    store: new RedisStore({ client: redisClient, prefix: 'rate-limit:' }),
    windowMs,
    max,
    message: 'Слишком много запросов, попробуйте позже',
    handler: (req, res, next) => {
      logger.warn(`Rate limit exceeded for ${role} (IP: ${req.ip})`);
      res.status(429).json({ success: false, message: 'Слишком много запросов, попробуйте позже' });
    }
  })(req, res, next);
};

module.exports = rateLimiter;
