const cache = require('../services/cacheService');
const metrics = require('../services/metricsService');

const cacheMiddleware = (keyGenerator, ttl = 60) => {
    return async (req, res, next) => {
        const key = keyGenerator(req);
        const cachedData = await cache.get(key);
        if (cachedData) {
            metrics.increment('cache.hit');
            return res.status(200).json(JSON.parse(cachedData));
        }
        metrics.increment('cache.miss');
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, JSON.stringify(body), ttl);
            res.sendResponse(body);
        };
        next();
    };
};

module.exports = cacheMiddleware;