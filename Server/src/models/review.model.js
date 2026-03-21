import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
  },
);

// Prevent multiple reviews by same user
reviewSchema.index({ user: 1, movieId: 1, media_type: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
