// app.js - Основной файл Express сервера
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { webSocketServer } = require('./utils/webSocket');
const { startDealExpiryHandler } = require('./workers/dealExpiryHandler');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const escrowRoutes = require('./routes/escrow');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const disputeRoutes = require('./routes/disputes');

// Импорт middleware авторизации
const { checkRevokedToken, verifyToken } = require('./middleware/authMiddleware');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware для безопасности
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Ограничение частоты запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов с вашего IP, попробуйте позже.',
});
app.use(limiter);

// Логирование HTTP-запросов
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Подключение к MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/escrow', verifyToken, escrowRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);
app.use('/api/disputes', verifyToken, disputeRoutes);

// Интеграция WebSocket
server.on('upgrade', (request, socket, head) => {
  webSocketServer.handleUpgrade(request, socket, head, (ws) => {
    webSocketServer.emit('connection', ws, request);
  });
});

// Запуск обработчика истечения срока сделок
startDealExpiryHandler();

// Обработка ошибок 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Централизованная обработка ошибок
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));



