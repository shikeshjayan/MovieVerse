import Media from "../models/media.model.js";
import MediaStats from "../models/mediaStats.model.js";

export const findOrCreateMedia = async (data, mediaType) => {
  const { tmdbId, title, poster_path, backdrop_path, overview, release_date, vote_average, genres } = data;
  const numericId = Number(tmdbId);

  let media = await Media.findOne({ tmdbId: numericId, mediaType });
  if (!media) {
    try {
      media = await Media.create({
        tmdbId: numericId,
        mediaType,
        title,
        posterPath: poster_path,
        backdropPath: backdrop_path,
        overview,
        releaseDate: release_date,
        voteAverage: vote_average,
        genres,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        media = await Media.findOne({ tmdbId: numericId, mediaType });
      } else {
        throw createErr;
      }
    }
  }
  return media;
};

export const updateMediaStats = async (tmdbId, mediaType, field, increment = 1) => {
  return MediaStats.findOneAndUpdate(
    { tmdbId: Number(tmdbId), mediaType },
    { $inc: { [field]: increment } },
    { upsert: true, new: true }
  );
};

export const emitSocketEvent = (req, eventName, data) => {
  const io = req.app.get("io");
  if (io && req.user?._id) {
    io.to(req.user._id.toString()).emit(eventName, data);
  }
};

export const getMediaType = (typeParam, defaultType = "movie") => {
  return typeParam === "tv" ? "tv" : defaultType;
};

export const parseNumericId = (id) => {
  const numericId = Number(id);
  return Number.isNaN(numericId) ? null : numericId;
};
