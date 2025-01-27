// dealExpiryHandler.js - Обработка истечения срока сделок
const Deal = require('../models/Deal');
const logger = require('../utils/logger');

// Периодическая проверка статуса сделок
async function checkExpiredDeals() {
  try {
    const now = new Date();

    // Обновляем статус всех истёкших сделок
    const result = await Deal.updateMany(
      { status: 'pending', deadline: { $lte: now } },
      { status: 'expired' }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Обновлено сделок: ${result.modifiedCount}`);
    }
  } catch (error) {
    logger.error(`Ошибка при проверке истёкших сделок: ${error.message}`);
  }
}

// Запуск периодической проверки
function startDealExpiryHandler(interval = 60000) { // Интервал по умолчанию: 60 секунд
  // Only start if we're not in test environment
  if (process.env.NODE_ENV !== 'test') {
    setInterval(checkExpiredDeals, interval);
    logger.info('Обработчик истечения срока сделок запущен');
  }
}

module.exports = { startDealExpiryHandler };

