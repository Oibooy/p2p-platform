
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

const errorHandler = (err, req, res, next) => {
  // Логируем ошибку с дополнительным контекстом
  logger.error({
    type: err.constructor.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Обработка операционных ошибок (известные ошибки приложения)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code
    });
  }

  // Обработка ошибок валидации MongoDB
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Обработка дубликатов MongoDB
  if (err.code === 11000) {
    return res.status(400).json({
      status: 'fail',
      message: 'Duplicate field value',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // В production отправляем общее сообщение об ошибке
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }

  // В development отправляем детали ошибки
  return res.status(500).json({
    status: 'error',
    message: err.message,
    stack: err.stack,
    error: err
  });
};

module.exports = { errorHandler };