const mongoose = require('mongoose');
const logger = require('../infrastructure/logger');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      logger.info('✅ MongoDB успешно подключена');
      return;
    } catch (err) {
      logger.error(`❌ Ошибка подключения к MongoDB (попытка ${i + 1}): ${err.message}`);
      if (i < retries - 1) await delay(5000);
    }
  }
  process.exit(1);
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('🔴 Соединение с MongoDB закрыто');
  } catch (err) {
    logger.error(`Ошибка при отключении от MongoDB: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
