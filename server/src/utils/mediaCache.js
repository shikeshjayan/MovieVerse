import MediaCache from "../models/MediaCache.js";
import { fetchFromTMDB } from "../services/tmdbService.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

const isExpired = (date) => {
  return (Date.now() - new Date(date)) > ONE_DAY;
};

const getCacheTTL = (days = 1) => {
  return new Date(Date.now() + days * ONE_DAY);
};

export const saveCache = async (key, data, ttl = 7) => {
  await MediaCache.findOneAndUpdate(
    { key },
    { data, updatedAt: new Date(), expiresAt: getCacheTTL(ttl) },
    { upsert: true }
  );
};

export const fetchWithCache = async (key, tmdbEndpoint, options = {}) => {
  const { allowStale = true, ttl = 7 } = options;
  
  let cache = await MediaCache.findOne({ key });
  
  if (cache && !isExpired(cache.updatedAt)) {
    return { data: cache.data, fromCache: true };
  }
  
  try {
    const data = await fetchFromTMDB(tmdbEndpoint);
    await saveCache(key, data, ttl);
    return { data, fromCache: false };
  } catch (error) {
    if (allowStale && cache) {
      return { data: cache.data, fromCache: true, stale: true };
    }
    throw error;
  }
};
