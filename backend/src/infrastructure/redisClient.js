const Redis = require('redis');
const logger = require('./logger');

let client = null;

const createClient = () => {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL не настроен, Redis отключён');
    return null;
  }

  return Redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.REDIS_URL.includes('rediss://'),
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        logger.warn(`Попытка переподключения Redis: ${retries}`);
        if (retries > 10) {
          logger.error('Достигнуто максимальное количество попыток переподключения к Redis');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });
};

const getClient = async () => {
  if (!client) {
    client = createClient();

    client.on('error', (err) => {
      logger.error('Ошибка Redis:', err);
    });

    client.on('connect', () => {
      logger.info('✅ Подключено к Redis');
    });

    try {
      await client.connect();
    } catch (err) {
      logger.error('❌ Ошибка подключения к Redis:', err);
      return null;
    }
  }
  return client;
};

const set = async (key, value, ttl = 3600) => {
  const redis = await getClient();
  if (!redis) return;
  await redis.setEx(key, ttl, JSON.stringify(value));
};

const get = async (key) => {
  const redis = await getClient();
  if (!redis) return null;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const closeClient = async () => {
  if (client) {
    await client.quit();
    logger.info('🔴 Соединение с Redis закрыто');
  }
};

module.exports = { getClient, set, get, closeClient };
