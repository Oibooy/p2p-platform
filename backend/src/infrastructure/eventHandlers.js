const Deal = require('../db/models/Deal');
const Notification = require('../db/models/Notification');
const { sendWebSocketNotification } = require('./webSocket');
const logger = require('./logger');

/**
 * Обработчик события DealCreated
 */
async function handleDealCreated(event) {
  try {
    const { dealId, buyer, seller, amount } = event;

    // Логирование события
    logger.info(`DealCreated event: dealId=${dealId}, buyer=${buyer}, seller=${seller}, amount=${amount}`);

    // Сохранение информации о сделке в базе данных
    const deal = new Deal({
      _id: dealId,
      buyer,
      seller,
      amount,
      status: 'pending',
    });

    await deal.save();

    // Уведомление участников сделки
    await sendNotification(buyer, 'Deal created successfully.', { dealId });
    await sendNotification(seller, 'You have a new deal request.', { dealId });

    // Уведомление через WebSocket
    sendWebSocketNotification(buyer, 'deal_created', { dealId });
    sendWebSocketNotification(seller, 'deal_created', { dealId });
  } catch (error) {
    logger.error(`Error handling DealCreated event: ${error.message}`);
  }
}

/**
 * Обработчик события FundsReleased
 */
async function handleFundsReleased(event) {
  try {
    const { dealId, seller, amount } = event;

    // Логирование события
    logger.info(`FundsReleased event: dealId=${dealId}, seller=${seller}, amount=${amount}`);

    // Обновление статуса сделки в базе данных
    const deal = await Deal.findById(dealId);
    if (deal) {
      deal.status = 'completed';
      await deal.save();
    }

    // Уведомление продавца
    await sendNotification(seller, 'Funds have been released to your account.', { dealId });

    // Уведомление через WebSocket
    sendWebSocketNotification(seller, 'funds_released', { dealId });
  } catch (error) {
    logger.error(`Error handling FundsReleased event: ${error.message}`);
  }
}

/**
 * Обработчик события FundsRefunded
 */
async function handleFundsRefunded(event) {
  try {
    const { dealId, buyer, amount } = event;

    // Логирование события
    logger.info(`FundsRefunded event: dealId=${dealId}, buyer=${buyer}, amount=${amount}`);

    // Обновление статуса сделки в базе данных
    const deal = await Deal.findById(dealId);
    if (deal) {
      deal.status = 'refunded';
      await deal.save();
    }

    // Уведомление покупателя
    await sendNotification(buyer, 'Funds have been refunded to your account.', { dealId });

    // Уведомление через WebSocket
    sendWebSocketNotification(buyer, 'funds_refunded', { dealId });
  } catch (error) {
    logger.error(`Error handling FundsRefunded event: ${error.message}`);
  }
}

/**
 * Универсальная функция уведомления
 */
async function sendNotification(userId, message, data) {
  try {
    const notification = new Notification({
      user: userId,
      message,
      data,
    });

    await notification.save();
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
  }
}

module.exports = {
  handleDealCreated,
  handleFundsReleased,
  handleFundsRefunded,
};