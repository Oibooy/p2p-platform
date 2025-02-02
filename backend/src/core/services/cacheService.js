// src/services/cacheService.js
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

const cacheService = {
    get: promisify(client.get).bind(client),
    set: (key, value, ttl) => {
        client.setex(key, ttl, value);
    },
    del: promisify(client.del).bind(client)
};

module.exports = cacheService;
