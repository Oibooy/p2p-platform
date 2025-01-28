const logger = require('../../infrastructure/logger');

const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${time.toFixed(2)}ms`;
    
    if (time > 1000) {
      logger.warn(`Slow request: ${message}`);
    } else {
      logger.info(message);
    }
  });
  
  next();
};

module.exports = performanceMonitor;
