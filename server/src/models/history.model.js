/**
 * History model - tracks user's watch history
 * Used for recommendation system and watch progress tracking
 */
import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      required: true
    },

    watchedAt: {
      type: Date,
      default: Date.now
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },

    interactionType: {
      type: String,
      enum: ['implicit_play', 'explicit_watch', 'stream'],
      default: 'explicit_watch'
    },

    playCount: {
      type: Number,
      default: 1
    },

    lastPlayedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate history records for same user-media pair
historySchema.index({ user: 1, media: 1 }, { unique: true });

export default mongoose.model("History", historySchema);