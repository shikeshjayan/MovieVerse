import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      index: true,
    },

    originalTitle: {
      type: String,
    },

    overview: {
      type: String,
    },

    genres: [
      {
        id: Number,
        name: String,
      },
    ],

    genreIds: [
      {
        type: Number,
        index: true, // faster filtering
      },
    ],

    posterPath: {
      type: String,
    },

    backdropPath: {
      type: String,
    },

    releaseDate: {
      type: Date,
      index: true,
    },

    runtime: {
      type: Number, // in minutes
    },

    status: {
      type: String, // Released, Upcoming
    },

    originalLanguage: {
      type: String,
      index: true,
    },

    popularity: {
      type: Number,
      index: true,
    },

    voteAverage: {
      type: Number,
      index: true,
    },

    voteCount: {
      type: Number,
    },

    adult: {
      type: Boolean,
      default: false,
    },

    video: {
      type: Boolean,
      default: false,
    },

    // 🔥 Recommendation helpers
    keywords: [
      {
        type: String,
        index: true,
      },
    ],

    cast: [
      {
        id: Number,
        name: String,
        character: String,
        profilePath: String,
      },
    ],

    crew: [
      {
        id: Number,
        name: String,
        job: String,
      },
    ],

    director: {
      type: String,
      index: true,
    },

    // 🔥 Engagement tracking (optional but powerful)
    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    // 🔥 For caching freshness
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // 🔥 Source tracking
    source: {
      type: String,
      default: "tmdb",
    },
  },
  {
    timestamps: true,
  },
);

movieSchema.index({ popularity: -1 });
movieSchema.index({ voteAverage: -1 });
movieSchema.index({ title: "text" });

const Movie = mongoose.model("movie", movieSchema);

export default Movie;
