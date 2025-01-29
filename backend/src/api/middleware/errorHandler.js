const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

const errorHandler = (err, req, res, next) => {
  // Логируем ошибку
  const logData = {
    type: err.constructor.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  };

  if (err instanceof AppError || err.name === 'ValidationError' || err.code === 11000) {
    logger.warn(logData); // Используем warn для предсказуемых ошибок
  } else {
    logger.error(logData);
  }

  res.setHeader('Content-Type', 'application/json'); // Гарантируем JSON

  // Ошибки JSON (например, неверный формат тела запроса)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid JSON syntax'
    });
  }

  // Кастомные ошибки приложения
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code
    });
  }

  // Ошибки валидации MongoDB
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Ошибки дубликатов MongoDB
  if (err.code === 11000) {
    return res.status(400).json({
      status: 'fail',
      message: 'Duplicate field value',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Ошибки MongoDB, которые не попали в другие проверки
  if (err.name && err.name.includes('Mongo')) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Общая ошибка сервера
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }

  // Ошибка в режиме разработки (отдаём стек)
  return res.status(500).json({
    status: 'error',
    message: err.message,
    stack: err.stack,
    error: err
  });
};

module.exports = { errorHandler, asyncHandler };
