const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { webSocketServer } = require('./utils/webSocket');
const { startDealExpiryHandler } = require('./workers/dealExpiryHandler');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const disputesRoutes = require('./routes/disputes');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const dealsRoutes = require('./routes/deals');
const escrowRoutes = require('./routes/escrow');
const { verifyToken, checkRole } = require('./middleware/authMiddleware');


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
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
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


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
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