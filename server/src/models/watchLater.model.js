/**
 * WatchLater model - user's queue of media to watch
 * Used for recommendations and user preference tracking
 */
import mongoose from "mongoose";

const watchLaterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate media per user
watchLaterSchema.index({ user: 1, media: 1 }, { unique: true });

export default mongoose.model("WatchLater", watchLaterSchema);
