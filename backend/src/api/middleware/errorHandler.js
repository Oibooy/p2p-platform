const logger = require('../../infrastructure/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${req.method} ${req.url} - ${err.message}`, {
    stackTrace: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

module.exports = { AppError, errorHandler };
const { AppError } = require('../../infrastructure/errors');
const logger = require('../../infrastructure/logger');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    logger.error({
      type: err.constructor.name,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method
    });
    
    return res.status(err.statusCode).json({
      status: err.status,
      error: err.message
    });
  }

  logger.error({
    type: 'UnhandledError',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    status: 'error',
    error: 'Internal server error'
  });
};

module.exports = errorHandler;
