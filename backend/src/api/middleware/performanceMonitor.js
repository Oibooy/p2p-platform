const logger = require('../../infrastructure/logger');
const metrics = require('../../core/services/metricsService');

const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6; // Конвертируем в миллисекунды
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${time.toFixed(2)}ms`;

    metrics.observe('http_request_duration_seconds', { method: req.method, route: req.originalUrl, status: res.statusCode }, time / 1000);

    if (time > 1000) {
      logger.warn(`Slow request: ${message}`);
      metrics.increment('http_slow_requests_total');
    } else {
      logger.info(message);
    }
  });

  next();
};

module.exports = performanceMonitor;

