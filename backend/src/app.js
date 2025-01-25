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
app.use(cors());
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
    await mongoose.connect(process.env.MONGO_URI, {
    });
    logger.info('MongoDB connected');

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
server.listen(PORT, '0.0.0.0', () => logger.info(`Server running on port ${PORT}`));