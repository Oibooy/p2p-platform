const redisClient = require('../../infrastructure/redisClient');

exports.saveRefreshToken = async (userId, tokenId, refreshToken, userAgent, ip) => {
  const redis = await redisClient.getClient();
  if (redis) {
    await redis.set(
      `refresh_token:${userId}:${tokenId}`,
      JSON.stringify({
        refreshToken,
        userAgent,
        ip,
        createdAt: new Date().toISOString()
      }),
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );
  }
};