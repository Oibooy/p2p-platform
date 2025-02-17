const config = require('../../config');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');
const Sentry = require('@sentry/node');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const requestId = req.headers['x-request-id'] || 'N/A';

  const logData = {
    type: err.constructor.name,
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    requestId,
    stack: config.node_env === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  };

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logData.message = 'Invalid or expired token';
    logger.warn(logData);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (err instanceof AppError || err.name === 'ValidationError' || err.code === 11000) {
    logger.warn(logData);
  } else {
    logger.error(logData);
    Sentry.captureException(err);
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json({ success: false, message: err.message, errors: err.errors || [] });
};

module.exports = { asyncHandler, errorHandler };