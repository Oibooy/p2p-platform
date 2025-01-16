// errorHandler.js - Централизованное middleware для обработки ошибок
const logger = require('../utils/logger');

// Централизованное middleware для обработки ошибок
const errorHandler = (err, req, res, next) => {
  // Логирование ошибки
  logger.error(`${req.method} ${req.url} - ${err.message}`);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Ошибка сервера',
    },
  });
};

module.exports = errorHandler;
