/**
 * Middleware to filter admin-hidden media from search and browse results
 * Ensures content moderation decisions are respected across the app
 */
import MediaStats from "../models/mediaStats.model.js";

/**
 * Filter out hidden media from a list (used in search and trending endpoints)
 * @param {Array} mediaList - Array of media objects to filter
 * @param {string} mediaType - Type of media ("movie" or "tv")
 * @returns {Array} Filtered list excluding hidden content
 */
export const filterHiddenMedia = async (mediaList, mediaType = "movie") => {
  if (!mediaList || !Array.isArray(mediaList)) return mediaList;
  if (mediaList.length === 0) return mediaList;
  
  const mediaIds = mediaList.map(m => m.id || m.tmdbId);
  
  try {
    // Fetch all hidden media IDs for the given type
    const hiddenStats = await MediaStats.find({
      tmdbId: { $in: mediaIds },
      mediaType,
      isHidden: true,
    }).select("tmdbId");

    const hiddenIds = new Set(hiddenStats.map(s => s.tmdbId));
    
    // Return only visible media
    return mediaList.filter(media => !hiddenIds.has(media.id || media.tmdbId));
  } catch (error) {
    console.error("Error filtering hidden media:", error);
    return mediaList;
  }
};

/**
 * Check if a specific media item is hidden
 * @param {number|string} tmdbId - TMDB ID of the media
 * @param {string} mediaType - Type of media ("movie" or "tv")
 * @returns {boolean} True if media is hidden
 */
export const isMediaHidden = async (tmdbId, mediaType = "movie") => {
  try {
    const stats = await MediaStats.findOne({
      tmdbId: parseInt(tmdbId),
      mediaType,
      isHidden: true,
    });
    return !!stats;
  } catch (error) {
    console.error("Error checking media hidden status:", error);
    return false;
  }
};

/**
 * Get list of hidden media IDs from a given set
 * @param {Array} mediaIds - Array of TMDB IDs to check
 * @param {string} mediaType - Type of media ("movie" or "tv")
 * @returns {Array} Array of hidden TMDB IDs
 */
export const getHiddenMediaIds = async (mediaIds, mediaType = "movie") => {
  try {
    const hiddenStats = await MediaStats.find({
      tmdbId: { $in: mediaIds },
      mediaType,
      isHidden: true,
    }).select("tmdbId");
    
    return hiddenStats.map(s => s.tmdbId);
  } catch (error) {
    console.error("Error getting hidden media IDs:", error);
    return [];
  }
};
