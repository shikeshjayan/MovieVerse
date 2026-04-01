/**
 * Media Cache model - persistent cache for TMDB data
 * Uses MongoDB TTL index for automatic expiration
 */
import mongoose from "mongoose";

const movieCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // TTL field - MongoDB auto-deletes documents after this time
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - MongoDB automatically removes expired documents
movieCacheSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("MediaCache", movieCacheSchema);
