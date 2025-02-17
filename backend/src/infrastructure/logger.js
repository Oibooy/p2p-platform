const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const Sentry = require('@sentry/node');

// Инициализация Sentry для мониторинга ошибок
Sentry.init({ dsn: process.env.SENTRY_DSN });

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
});

// Логирование критических ошибок в Sentry
logger.on('error', (error) => {
  Sentry.captureException(error);
});

module.exports = logger;