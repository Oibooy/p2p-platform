const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const logger = require('./infrastructure/logger');
const errorHandler = require('./api/middleware/errorHandler');
const { webSocketServer } = require('./infrastructure/webSocket');
const { startDealExpiryHandler } = require('./core/jobs/dealExpiryHandler');

const authRoutes = require('./api/routes/auth');
const orderRoutes = require('./api/routes/orders');
const reviewRoutes = require('./api/routes/reviews');
const adminRoutes = require('./api/routes/admin');
const disputesRoutes = require('./api/routes/disputes');
const messagesRoutes = require('./api/routes/messages');
const notificationsRoutes = require('./api/routes/notifications');
const dealsRoutes = require('./api/routes/deals');
const escrowRoutes = require('./api/routes/escrow');
const { verifyToken, checkRole } = require('./api/middleware/authMiddleware');


dotenv.config();
const app = express();
const server = http.createServer(app);

// Trust proxy settings для корректной работы rate limit за прокси
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable pre-flight requests
app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
app.use(express.json());
app.use(morgan('dev', { stream: { write: (message) => logger.info(message.trim()) } }));


// Добавляем rate limiter
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Public routes first
app.use('/api/auth', authRoutes);
app.use('/api/orders/public', orderRoutes);
app.use('/api/reviews/public', reviewRoutes);

// Protected routes
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/reviews', verifyToken, reviewRoutes);
app.use('/api/admin', verifyToken, checkRole('admin'), adminRoutes);
app.use('/api/disputes', verifyToken, disputesRoutes);
app.use('/api/messages', verifyToken, messagesRoutes);
app.use('/api/notifications', verifyToken, notificationsRoutes);
app.use('/api/deals', verifyToken, dealsRoutes);
app.use('/api/escrow', verifyToken, escrowRoutes);

// Error handling for undefined routes
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Route not found' });
  }
  next();
});

// Database connection
async function connectToDatabase() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      autoCreate: true
    });

    // Wait for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('MongoDB connected');

    // Initialize default roles after successful connection
    const Role = require('./models/Role');
    const roles = ['user', 'moderator', 'admin'];

    const initializeRoles = async (roles, session) => {
      for (const roleName of roles) {
        const existingRole = await Role.findOne({ name: roleName }).session(session);
        if (!existingRole) {
          const role = new Role({ name: roleName });
          await role.save({ session });
        }
      }
    };

    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await initializeRoles(roles, session);
      });
      await session.endSession();
    } catch (error) {
      console.error('Error initializing roles:', error);
    }
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const roleName of roles) {
          await Role.findOneAndUpdate(
            { name: roleName },
            { name: roleName },
            {
              upsert: true,
              new: true,
              session
            }
          );
        }
      });
      logger.info('Default roles initialized');
    } finally {
      await session.endSession();
    }


    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
      process.exit(0);
    });
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}
connectToDatabase();

//WebSocket Integration
server.on('upgrade', (request, socket, head) => {
  webSocketServer.handleUpgrade(request, socket, head, (ws) => {
    webSocketServer.emit('connection', ws, request);
  });
});

// Start deal expiry handler
startDealExpiryHandler();

// Error handling middleware
const performanceMonitor = require('./middleware/performanceMonitor');

// Мониторинг производительности
app.use(performanceMonitor);

// Глобальная обработка необработанных исключений
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

// Централизованная обработка ошибок
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

// Запускаем сервер только если не в тестовом режиме или не отключен веб-интерфейс
if (process.env.NODE_ENV === 'test') {
  // В тестовом режиме сервер запускается через supertest
  module.exports = server;
} else if (process.env.DISABLE_WEB !== 'true') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Server is listening on port ${PORT}`);
  });
}

module.exports = server;