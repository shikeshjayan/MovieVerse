import Wishlist from "../models/wishlist.model.js";
import WatchLater from "../models/watchLater.model.js";
import Notification from "../models/notification.model.js";
import Media from "../models/media.model.js";

const createNotification = async (userId, type, title, message, tmdbId, mediaType) => {
  const media = await Media.findOne({ tmdbId: Number(tmdbId), mediaType });
  const notification = await Notification.create({
    type,
    title,
    message,
    userId,
    tmdbId,
    mediaType,
    mediaTitle: media?.title,
    mediaPoster: media?.posterPath,
  });
  return notification;
};

const notifyUsersForMediaUpdate = async (tmdbId, mediaType, updateType, updateDetails) => {
  try {
    const [wishlistUsers, watchLaterUsers] = await Promise.all([
      Wishlist.find({ media: { $exists: true } })
        .populate({
          path: "media",
          match: { tmdbId: Number(tmdbId), mediaType },
        })
        .lean(),
      WatchLater.find({ media: { $exists: true } })
        .populate({
          path: "media",
          match: { tmdbId: Number(tmdbId), mediaType },
        })
        .lean(),
    ]);

    const validWishlistUsers = wishlistUsers.filter((w) => w.media);
    const validWatchLaterUsers = watchLaterUsers.filter((w) => w.media);

    const wishlistUserIds = [...new Set(validWishlistUsers.map((w) => w.user.toString()))];
    const watchLaterUserIds = [...new Set(validWatchLaterUsers.map((w) => w.user.toString()))];

    const media = await Media.findOne({ tmdbId: Number(tmdbId), mediaType });
    if (!media) return;

    const title = updateType === "new_content" 
      ? `New ${mediaType === "movie" ? "Movie" : "Show"} Available!`
      : `${media.title || "Media"} Updated`;

    const notificationType = updateType === "new_content" ? "media_update" : "watchlater_update";

    const notifications = [];

    if (updateType === "new_content") {
      for (const userId of [...new Set([...wishlistUserIds, ...watchLaterUserIds])]) {
        notifications.push(
          createNotification(
            userId,
            notificationType,
            title,
            `${media.title} is now available to stream!`,
            Number(tmdbId),
            mediaType
          )
        );
      }
    } else {
      if (updateDetails.wishlist) {
        for (const userId of wishlistUserIds) {
          notifications.push(
            createNotification(
              userId,
              "wishlist_update",
              title,
              `${media.title} in your wishlist has been updated: ${updateDetails.message}`,
              Number(tmdbId),
              mediaType
            )
          );
        }
      }

      if (updateDetails.watchLater) {
        for (const userId of watchLaterUserIds) {
          notifications.push(
            createNotification(
              userId,
              "watchlater_update",
              title,
              `${media.title} in your watchlater has been updated: ${updateDetails.message}`,
              Number(tmdbId),
              mediaType
            )
          );
        }
      }
    }

    await Promise.all(notifications);
    console.log(`Notifications sent to ${notifications.length} users for media ${tmdbId}`);
  } catch (error) {
    console.error("Error sending media update notifications:", error);
  }
};

const notifyRandomUsers = async (tmdbId, mediaType, percentage = 0.3) => {
  try {
    const [wishlistUsers, watchLaterUsers] = await Promise.all([
      Wishlist.find().populate("media").lean(),
      WatchLater.find().populate("media").lean(),
    ]);

    const allUserIds = new Set();
    const relevantMedia = [...wishlistUsers, ...watchLaterUsers]
      .filter((item) => item.media && item.media.tmdbId === Number(tmdbId) && item.media.mediaType === mediaType)
      .map((item) => item.user.toString());

    relevantMedia.forEach((id) => allUserIds.add(id));

    const userArray = Array.from(allUserIds);
    const countToNotify = Math.ceil(userArray.length * percentage);
    const shuffled = userArray.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, countToNotify);

    const media = await Media.findOne({ tmdbId: Number(tmdbId), mediaType });
    if (!media) return;

    const notifications = selectedUsers.map((userId) =>
      createNotification(
        userId,
        "media_update",
        "Check out what's trending!",
        `${media.title} is getting popular among users with similar taste!`,
        Number(tmdbId),
        mediaType
      )
    );

    await Promise.all(notifications);
    console.log(`Random notifications sent to ${notifications.length} users for media ${tmdbId}`);
  } catch (error) {
    console.error("Error sending random notifications:", error);
  }
};

export { notifyUsersForMediaUpdate, notifyRandomUsers, createNotification };
