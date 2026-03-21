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

    // ✅ Use separate field for TTL
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // keep createdAt & updatedAt for debugging
  }
);

// ✅ TTL index (auto delete after expiry time)
movieCacheSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("MediaCache", movieCacheSchema);
