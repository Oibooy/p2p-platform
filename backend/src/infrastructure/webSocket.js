const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

// Конфигурация WebSocket сервера
const webSocketServer = new WebSocket.Server({ noServer: true });
const clients = new Map(); // Хранение подключённых клиентов
const messageRateLimits = new Map(); // Лимиты сообщений по клиентам

// Максимальное количество сообщений в минуту
const MAX_MESSAGES_PER_MINUTE = 20;

// Отправка сообщения клиенту
function sendMessage(client, type, payload) {
  try {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  } catch (error) {
    logger.error(`Ошибка отправки сообщения: ${error.message}`);
  }
}

// Проверка лимита сообщений
function isRateLimited(userId) {
  const now = Date.now();
  const timestamps = messageRateLimits.get(userId) || [];
  const filteredTimestamps = timestamps.filter((timestamp) => now - timestamp < 60000);

  if (filteredTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    return true;
  }

  filteredTimestamps.push(now);
  messageRateLimits.set(userId, filteredTimestamps);
  return false;
}

// Обработка входящих сообщений
function handleMessage(userId, message) {
  try {
    const parsedMessage = JSON.parse(message);
    const { type, payload } = parsedMessage;

    switch (type) {
      case 'chat':
        logger.info(`Сообщение чата от ${userId}: ${payload.text}`);
        // Здесь можно вызвать функцию для обработки чата
        break;
      case 'notification':
        logger.info(`Уведомление от ${userId}: ${payload.text}`);
        // Здесь можно вызвать функцию для обработки уведомлений
        break;
      default:
        logger.warn(`Неизвестный тип сообщения от ${userId}: ${type}`);
    }
  } catch (error) {
    logger.error(`Ошибка обработки сообщения от ${userId}: ${error.message}`);
  }
}

// Обработка подключений
webSocketServer.on('connection', async (ws, req) => {
  try {
    ws.isAlive = true;
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Добавляем обработку ошибок соединения
    ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`);
      ws.terminate();
    });
    
    // Добавляем heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Ping every 30 seconds
    const interval = setInterval(() => {
      if (ws.isAlive === false) {
        clearInterval(interval);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);
    let token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Не указан токен');
      return;
    }

    token = decodeURIComponent(token).trim();
    if (!token.startsWith('Bearer ')) {
      ws.close(4001, 'Некорректный формат токена');
      return;
    }

    const tokenValue = token.split(' ')[1];
    const { id: userId } = jwt.verify(tokenValue, process.env.JWT_SECRET);

    clients.set(userId, ws);
    logger.info(`Пользователь ${userId} подключился через WebSocket`);

    ws.on('message', (message) => {
      if (isRateLimited(userId)) {
        sendMessage(ws, 'error', { message: 'Превышен лимит сообщений' });
        return;
      }
      handleMessage(userId, message);
    });

    ws.on('close', () => {
      clients.delete(userId);
      logger.info(`Пользователь ${userId} отключился`);
    });
  } catch (error) {
    logger.error(`Ошибка аутентификации WebSocket: ${error.message}`);
    ws.close(4001, 'Неверный токен');
  }
});

// Отправка уведомлений пользователю
function notifyUser(userId, type, payload) {
  const client = clients.get(userId);
  if (client) {
    sendMessage(client, type, payload);
  } else {
    logger.warn(`Пользователь ${userId} недоступен через WebSocket`);
  }
}

// Широковещательная отправка сообщений
function broadcast(type, payload) {
  clients.forEach((client) => {
    sendMessage(client, type, payload);
  });
}

// Add deal status notifications
function sendWebSocketNotification(userId, type, data) {
  const client = clients.get(userId);
  if (client) {
    sendMessage(client, type, { ...data, timestamp: new Date().toISOString() });
  } else {
    logger.warn(`Пользователь ${userId} недоступен для отправки уведомления о статусе сделки`);
  }
}

function notifyDealUpdate(dealId, buyerId, sellerId, status, additionalData = {}) {
  const notification = {
    dealId,
    status,
    ...additionalData
  };

  sendWebSocketNotification(buyerId, 'deal_update', notification);
  sendWebSocketNotification(sellerId, 'deal_update', notification);
}

module.exports = { webSocketServer, notifyUser, broadcast, sendWebSocketNotification, notifyDealUpdate };