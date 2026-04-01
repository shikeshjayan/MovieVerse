/**
 * Media model - cached TMDB movie/TV show data
 * Stores metadata for recommendation system and content filtering
 */
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    title: String,
    overview: String,
    posterPath: String,
    backdropPath: String,
    genres: [String],
    releaseDate: Date,
    popularity: Number,
    voteAverage: Number,
    voteCount: Number,
    language: String,
  },
  { timestamps: true }
);

// Compound unique index for movie + tv deduplication
mediaSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });
// Text index for full-text search
mediaSchema.index({ title: "text", overview: "text" });

export default mongoose.model("Media", mediaSchema);
