
const Redis = require('redis');

let client = null;

const createClient = () => {
  return Redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
      tls: true,
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        console.log(`Redis reconnection attempt ${retries}`);
        if (retries > 10) {
          console.log('Max Redis reconnection attempts reached');
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
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Connected to Redis');
    });

    try {
      await client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      return null;
    }
  }
  return client;
};

const closeConnection = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

module.exports = {
  getClient,
  closeConnection
};
