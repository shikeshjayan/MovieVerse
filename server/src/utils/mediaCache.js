/**
 * Media Cache utility functions
 * MongoDB-backed caching with automatic TTL expiration
 */
import MediaCache from "../models/MediaCache.js";
import { fetchFromTMDB } from "../services/tmdbService.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Check if cached data is expired based on updatedAt timestamp
 */
const isExpired = (date) => {
  return (Date.now() - new Date(date)) > ONE_DAY;
};

/**
 * Calculate expiration date from now
 */
const getCacheTTL = (days = 1) => {
  return new Date(Date.now() + days * ONE_DAY);
};

/**
 * Save data to cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Days until expiration
 */
export const saveCache = async (key, data, ttl = 7) => {
  await MediaCache.findOneAndUpdate(
    { key },
    { data, updatedAt: new Date(), expiresAt: getCacheTTL(ttl) },
    { upsert: true }
  );
};

/**
 * Fetch data with cache-aside pattern
 * @param {string} key - Cache key
 * @param {string} tmdbEndpoint - TMDB endpoint to fetch if cache miss
 * @param {Object} options - { allowStale: boolean, ttl: number }
 * @returns {Object} { data, fromCache, stale? }
 */
export const fetchWithCache = async (key, tmdbEndpoint, options = {}) => {
  const { allowStale = true, ttl = 7 } = options;
  
  let cache = await MediaCache.findOne({ key });
  
  // Return fresh cache
  if (cache && !isExpired(cache.updatedAt)) {
    return { data: cache.data, fromCache: true };
  }
  
  try {
    // Fetch from TMDB and save to cache
    const data = await fetchFromTMDB(tmdbEndpoint);
    await saveCache(key, data, ttl);
    return { data, fromCache: false };
  } catch (error) {
    // Allow stale cache fallback on API failure
    if (allowStale && cache) {
      return { data: cache.data, fromCache: true, stale: true };
    }
    throw error;
  }
};
