const Redis = require('redis');

const client = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
};

module.exports = {
  getClient: async () => {
    return await connectRedis();
  }
};