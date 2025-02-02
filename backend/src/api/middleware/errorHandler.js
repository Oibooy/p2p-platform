const config = require('../../config');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const logData = {
    type: err.constructor.name,
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    stack: config.env === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof AppError || err.name === 'ValidationError' || err.code === 11000) {
    logger.warn(logData);
  } else {
    logger.error(logData);
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json({ success: false, message: err.message, errors: err.errors || [] });
};

module.exports = { asyncHandler, errorHandler };