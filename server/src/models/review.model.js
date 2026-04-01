/**
 * Review model for user reviews on movies/TV shows
 * Includes reporting system for content moderation
 */
import mongoose from "mongoose";

// Sub-schema for review reports
const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason: { type: String, enum: ["spam", "abuse", "spam", "irrelevant", "other"] },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    movieId: {
      type: Number,
      required: true,
    },

    media_type: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    spoiler: {
      type: Boolean,
      default: false,
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isHidden: {
      type: Boolean,
      default: false,
    },

    isInappropriate: {
      type: Boolean,
      default: false,
    },

    reportCount: {
      type: Number,
      default: 0,
    },

    reports: [reportSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
reviewSchema.index({ user: 1, movieId: 1, media_type: 1 }, { unique: true }); // One review per user per media
reviewSchema.index({ reportCount: -1 }); // For admin moderation queue
reviewSchema.index({ isHidden: 1 }); // For filtering hidden reviews
reviewSchema.index({ createdAt: -1 }); // For chronological sorting

export default mongoose.model("Review", reviewSchema);
