const mongoose = require('mongoose');
const logger = require('../infrastructure/logger');

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
// src/config.js
require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    USDT_TOKEN_ADDRESS: process.env.USDT_TOKEN_ADDRESS,
    TRON_PRIVATE_KEY: process.env.TRON_PRIVATE_KEY
};
