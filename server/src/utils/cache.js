/**
 * In-memory cache utility for API responses
 * Provides TTL-based caching with automatic expiration
 */
const cache = new Map();
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Retrieve cached data if valid (not expired)
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

/**
 * Store data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 15 min)
 */
export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
};

/**
 * Invalidate all cache entries matching a prefix pattern
 * @param {string} prefix - Key prefix to match for invalidation
 */
export const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear all cached entries (use with caution)
 */
export const clearAllCache = () => {
  cache.clear();
};

export default { getCache, setCache, invalidateCache, clearAllCache };