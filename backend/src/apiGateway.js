const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const logger = require('../infrastructure/logger');
const { authenticate } = require('../middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Ограничение запросов (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов на IP
  message: 'Превышен лимит запросов, попробуйте позже',
});
app.use(limiter);

// Прокси маршруты к микросервисам
const services = {
  auth: 'http://localhost:5001',
  orders: 'http://localhost:5002',
  payments: 'http://localhost:5003',
};

Object.keys(services).forEach((service) => {
  app.use(
    `/api/${service}`,
    authenticate,
    createProxyMiddleware({
      target: services[service],
      changeOrigin: true,
      pathRewrite: { [`^/api/${service}`]: '' },
      onProxyReq: (proxyReq, req) => {
        logger.info(`🔀 API Gateway: ${req.method} ${req.originalUrl} → ${services[service]}`);
      },
    })
  );
});

app.listen(5000, () => {
  logger.info('🚀 API Gateway запущен на порту 5000');
});

module.exports = app;
