const Redis = require('ioredis');

let client = null;

const getClient = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry — fail silently
    });
    client.on('error', () => {}); // suppress connection errors
  }
  return client;
};

/**
 * Get a cached value. Returns null if key doesn't exist or Redis is unavailable.
 */
const getCache = async (key) => {
  try {
    const val = await getClient().get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

/**
 * Set a cached value with TTL in seconds (default 5 minutes).
 */
const setCache = async (key, value, ttl = 300) => {
  try {
    await getClient().set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Redis unavailable — silently fall through
  }
};

/**
 * Delete one or more cached keys.
 */
const delCache = async (...keys) => {
  try {
    await getClient().del(...keys);
  } catch {}
};

module.exports = { getCache, setCache, delCache };
