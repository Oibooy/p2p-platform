const jwt = require('jsonwebtoken');
const User = require('../../db/models/User'); // Импорт модели пользователя
const redisClient = require('../../infrastructure/redisClient'); // Подключение Redis

/**
 * Middleware для проверки токена.
 */
async function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ 
      status: 'error',
      code: 'TOKEN_MISSING',
      message: 'Authentication required'
    });
  }

  // Rate limiting check
  const requestCount = await redisClient.incr(`auth_requests:${req.ip}`);
  await redisClient.expire(`auth_requests:${req.ip}`, 60 * 60); // 1 hour expiry

  if (requestCount > 100) { // 100 requests per hour limit
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    });
  }

  // Проверяем формат токена
  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Invalid token format',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    if (!token.startsWith('Bearer ')) {
      throw new AuthorizationError('Invalid token format');
    }

    const extractedToken = token.split(' ')[1];

    // Проверка отзыва токена
    const isRevoked = await isTokenRevoked(extractedToken);
    if (isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
    }

    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);

    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        error: 'Invalid token type. Access token required.',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    //Improved user lookup with error handling
    let user;
    try {
        user = await User.findById(decoded.id);
    } catch (dbError) {
        console.error(`[${new Date().toISOString()}] Database error during user lookup:`, dbError);
        return res.status(500).json({ error: 'Internal server error' });
    }


    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Token verification failed:`, error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token signature',
        code: 'INVALID_SIGNATURE'
      });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        error: 'Token not yet valid',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Middleware для проверки роли пользователя.
 */
function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      console.log(`[${new Date().toISOString()}] Access denied for role: ${req.user?.role}`);
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

/**
 * Middleware для проверки отзыва токена (например, при logout).
 */
async function checkRevokedToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    throw new AuthorizationError('Access denied. No token provided.');
  }

  const isRevoked = await isTokenRevoked(token);
  if (isRevoked) {
    return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
  }

  next();
}

/**
 * Проверка, был ли токен отозван.
 */
async function isTokenRevoked(token) {
  try {
    const client = await redisClient.getClient();
    if (!client) {
      console.warn('Redis client not available, skipping token revocation check');
      return false;
    }
    const result = await client.get(token);
    return result !== null;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Redis error:`, err.message);
    return false;
  }
}

/**
 * Отзыв токена (например, при logout).
 */
async function revokeToken(token, expirationTime) {
  return new Promise((resolve, reject) => {
    redisClient.set(token, 'revoked', 'EX', expirationTime, (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Redis set error:`, err.message);
        return reject(err);
      }
      resolve(true);
    });
  });
}

module.exports = { verifyToken, checkRole, checkRevokedToken, revokeToken };
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { 
    error: 'Too many auth attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = { verifyToken, checkRole, checkRevokedToken, revokeToken, authLimiter };