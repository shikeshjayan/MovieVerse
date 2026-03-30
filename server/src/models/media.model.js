// models/media.model.js
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
  { timestamps: true },
);

mediaSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });
mediaSchema.index({ title: "text", overview: "text" });

export default mongoose.model("Media", mediaSchema);
