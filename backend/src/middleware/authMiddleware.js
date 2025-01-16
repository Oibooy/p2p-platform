const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Импорт модели пользователя
const redisClient = require('../utils/redisClient'); // Подключение Redis

/**
 * Middleware для проверки токена.
 */
async function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    console.log(`[${new Date().toISOString()}] Authorization header is missing`);
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    if (!token.startsWith('Bearer ')) {
      console.log(`[${new Date().toISOString()}] Invalid token format: ${token}`);
      return res.status(400).json({ error: 'Invalid token format.' });
    }

    const extractedToken = token.split(' ')[1];

    // Проверка отзыва токена
    const isRevoked = await isTokenRevoked(extractedToken);
    if (isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
    }

    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
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
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    return res.status(400).json({ error: 'Invalid token.' });
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
    return res.status(401).json({ error: 'Access denied. No token provided.' });
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
  return new Promise((resolve, reject) => {
    redisClient.get(token, (err, result) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Redis error:`, err.message);
        return reject(err);
      }
      resolve(result !== null); // Если токен найден в Redis, он отозван
    });
  });
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




