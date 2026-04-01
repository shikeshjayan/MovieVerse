/**
 * Notification model for user alerts
 * Stores system notifications, media updates, and security alerts
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: ["login", "register", "suspicious", "admin_action", "system", "media_update", "watchlater_update", "wishlist_update"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },
    tmdbId: {
      type: Number,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
    },
    mediaTitle: {
      type: String,
    },
    mediaPoster: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
