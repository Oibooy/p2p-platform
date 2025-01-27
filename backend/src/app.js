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
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const disputesRoutes = require('./routes/disputes');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const dealsRoutes = require('./routes/deals');
const escrowRoutes = require('./routes/escrow');
const { verifyToken } = require('./middleware/authMiddleware');


dotenv.config();
const app = express();
const server = http.createServer(app);

// Trust proxy settings для корректной работы rate limit за прокси
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/disputes', verifyToken, disputesRoutes);
app.use('/api/messages', verifyToken, messagesRoutes);
app.use('/api/notifications', verifyToken, notificationsRoutes);
app.use('/api/deals', verifyToken, dealsRoutes);
app.use('/api/escrow', verifyToken, escrowRoutes);

// Database connection
async function connectToDatabase() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoCreate: true
    });

    // Wait for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('MongoDB connected');

    // Initialize default roles after successful connection
    const Role = require('./models/Role');
    const roles = ['user', 'moderator', 'admin'];
    
    const session = await connection.startSession();
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
app.use((req, res, next) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Запускаем сервер только если не в тестовом режиме
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = server;