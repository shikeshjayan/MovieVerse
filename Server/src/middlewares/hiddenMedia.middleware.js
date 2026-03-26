import MediaStats from "../models/mediaStats.model.js";

export const filterHiddenMedia = async (mediaList, mediaType = "movie") => {
  if (!mediaList || !Array.isArray(mediaList)) return mediaList;
  if (mediaList.length === 0) return mediaList;
  
  const mediaIds = mediaList.map(m => m.id || m.tmdbId);
  
  try {
    const hiddenStats = await MediaStats.find({
      tmdbId: { $in: mediaIds },
      mediaType,
      isHidden: true,
    }).select("tmdbId");

    const hiddenIds = new Set(hiddenStats.map(s => s.tmdbId));
    
    return mediaList.filter(media => !hiddenIds.has(media.id || media.tmdbId));
  } catch (error) {
    console.error("Error filtering hidden media:", error);
    return mediaList;
  }
};

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
