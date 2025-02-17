const redisClient = require('../../infrastructure/redisClient');
const logger = require('../../infrastructure/logger');

class SessionRepository {
  /**
   * 📌 Сохранение сессии в Redis с автоудалением
   */
  async createSession(userId, token, ttl = 86400) {
    const sessionKey = `session:${userId}:${token}`;
    await redisClient.set(sessionKey, JSON.stringify({ userId, token }), ttl);
    logger.info(`✅ Сессия создана для пользователя ${userId}`);
  }

  /**
   * 📌 Проверка, существует ли сессия
   */
  async isSessionValid(userId, token) {
    const sessionKey = `session:${userId}:${token}`;
    return !!(await redisClient.get(sessionKey));
  }

  /**
   * 📌 Удаление сессии (logout)
   */
  async deleteSession(userId, token) {
    const sessionKey = `session:${userId}:${token}`;
    await redisClient.del(sessionKey);
    logger.info(`🔴 Сессия удалена для пользователя ${userId}`);
  }

  /**
   * 📌 Удаление всех сессий пользователя
   */
  async deleteAllSessions(userId) {
    const keys = await redisClient.keys(`session:${userId}:*`);
    for (const key of keys) {
      await redisClient.del(key);
    }
    logger.info(`🔴 Все сессии удалены для пользователя ${userId}`);
  }
}

module.exports = new SessionRepository();
