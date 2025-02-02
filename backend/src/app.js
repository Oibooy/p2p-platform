const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression'); // Сжатие ответов
const dotenv = require('dotenv');
const http = require('http');
const xssClean = require('xss-clean'); // Защита от XSS
const logger = require('./infrastructure/logger');
const errorHandler = require('./api/middleware/errorHandler');
const performanceMonitor = require('./api/middleware/performanceMonitor');
const { webSocketServer } = require('./infrastructure/webSocket');
const { startDealExpiryHandler } = require('./workers/dealExpiryHandler');
const { monitorIncomingTransactions } = require('./services/hotWalletService');
const runMigrations = require('./db/migrations/migrationRunner');
const rateLimiter = require('./api/middleware/rateLimiter');
const routes = require('./api/routes'); // Импорт всех маршрутов

dotenv.config();

// Инициализация Express
const app = express();
const server = http.createServer(app);

// Middleware защиты
app.use(helmet());
app.use(cors());
app.use(xssClean());
app.use(compression());
app.use(morgan('combined'));

// Ограничение запросов
app.use(rateLimiter);

// Подключение Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Подключение маршрутов
app.use('/api', routes);

// Мониторинг производительности
app.use(performanceMonitor);

// Обработка 404 (не найденный маршрут)
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Route not found' });
  }
  next();
});

// Глобальная обработка ошибок
app.use(errorHandler);

// WebSocket Integration
server.on('upgrade', (request, socket, head) => {
  webSocketServer.handleUpgrade(request, socket, head, (ws) => {
    webSocketServer.emit('connection', ws, request);
  });
});

// Запуск обработчика истечения сделок
startDealExpiryHandler();

// Запуск мониторинга входящих транзакций
monitorIncomingTransactions();

// Глобальная обработка исключений
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully`);

  try {
    await mongoose.disconnect();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const PORT = process.env.PORT || 5000;

// Запускаем сервер
if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_WEB !== 'true') {
  server.listen(PORT, '0.0.0.0', async () => {
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Server is listening on port ${PORT}`);

    // Запуск миграций после старта сервера
    try {
      await runMigrations();
      logger.info('Database migrations applied successfully.');
    } catch (err) {
      logger.error('Error running migrations:', err);
    }
  });
}

module.exports = { app, server };
