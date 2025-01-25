
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info('MongoDB успешно подключена');
  } catch (err) {
    logger.error(`Ошибка подключения к MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
