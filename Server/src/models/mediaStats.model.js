import mongoose from "mongoose";

const mediaStatsSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    watchLaterCount: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    aiRecommendationCount: { type: Number, default: 0 },
    aiEngagementRate: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    hideReason: { type: String, enum: ["", "irrelevant", "inappropriate", "soft_delete"], default: "" },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    lastViewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mediaStatsSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });
mediaStatsSchema.index({ views: -1 });
mediaStatsSchema.index({ wishlistCount: -1 });
mediaStatsSchema.index({ aiRecommendationCount: -1 });
mediaStatsSchema.index({ featured: -1 });

export default mongoose.model("MediaStats", mediaStatsSchema);
