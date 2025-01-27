const Redis = require('redis');

const client = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
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