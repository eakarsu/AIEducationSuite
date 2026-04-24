const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheMiddleware = (keyPrefix) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      // Invalidate cache on CUD operations
      const keys = cache.keys().filter(k => k.startsWith(keyPrefix));
      keys.forEach(k => cache.del(k));
      return next();
    }

    const key = `${keyPrefix}:${req.userId}:${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data);
      return originalJson(data);
    };

    next();
  };
};

const invalidateCache = (keyPrefix) => {
  const keys = cache.keys().filter(k => k.startsWith(keyPrefix));
  keys.forEach(k => cache.del(k));
};

module.exports = { cacheMiddleware, invalidateCache, cache };
