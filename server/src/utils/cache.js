const cache = new Map();

const DEFAULT_TTL = 15 * 60 * 1000;

export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
};

export const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

export const clearAllCache = () => {
  cache.clear();
};

export default { getCache, setCache, invalidateCache, clearAllCache };