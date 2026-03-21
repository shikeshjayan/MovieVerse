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
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate history records for same movie
historySchema.index({ user: 1, media: 1 }, { unique: true });

export default mongoose.model("History", historySchema);