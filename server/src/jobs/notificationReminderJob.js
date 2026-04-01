/**
 * Scheduled job for sending watchlist reminder notifications
 * Runs at 9 AM and 6 PM daily to re-engage users
 */
import cron from 'node-cron';
import mongoose from 'mongoose';
import Wishlist from '../models/wishlist.model.js';
import WatchLater from '../models/watchLater.model.js';
import Notification from '../models/notification.model.js';
import Media from '../models/media.model.js';
import User from '../models/user.model.js';

// Random reminder messages
const REMINDER_MESSAGES = [
  "You have some items waiting for you!",
  "Time to catch up on your watchlist!",
  "Your watchlater list is waiting!",
  "Don't forget about your saved movies!",
  "Ready for movie night?",
];

// Rate limiting for notifications
const MAX_NOTIFICATIONS_PER_USER_PER_DAY = 2;
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 12;

/**
 * Generate random reminder message based on item count
 */
const getRandomMessage = (count, title) => {
  const messages = [
    `You have ${count} item${count > 1 ? 's' : ''} in your watchlater. Let's watch!`,
    `Your watchlater has ${count} movie${count > 1 ? 's' : ''} waiting for you!`,
    `Don't miss out! You have ${count} item${count > 1 ? 's' : ''} saved.`,
    `Time to watch something! ${count} item${count > 1 ? 's' : ''} on your list.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Send reminder notifications to users with watchlist items
 * Limits notifications per user to prevent spam
 */
const sendReminderNotifications = async () => {
  try {
    const io = global.io;
    if (!io) {
      console.log('[NotificationReminder] Socket.io not initialized yet');
      return;
    }

    // Get user counts for wishlist and watchlater
    const usersWithWishlist = await Wishlist.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const usersWithWatchLater = await WatchLater.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    // Merge user lists
    const userLists = new Map();
    
    usersWithWishlist.forEach(u => {
      userLists.set(u._id.toString(), { wishlist: u.count, watchLater: 0 });
    });
    
    usersWithWatchLater.forEach(u => {
      const existing = userLists.get(u._id.toString()) || { wishlist: 0 };
      existing.watchLater = u.count;
      userLists.set(u._id.toString(), existing);
    });

    // Build list of users to potentially notify
    const usersToNotify = [];
    userLists.forEach((lists, userId) => {
      const total = lists.wishlist + lists.watchLater;
      if (total >= 1) {
        usersToNotify.push({ userId, ...lists, total });
      }
    });

    // Filter out admin users
    const nonAdminUsers = await User.find({ role: { $ne: 'admin' } }).select('_id lastLogin').lean();
    const nonAdminUserIds = new Set(nonAdminUsers.map(u => u._id.toString()));
    const filteredUsers = usersToNotify.filter(u => nonAdminUserIds.has(u.userId));

    // Randomly select up to 100 users to notify
    const shuffled = filteredUsers.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, Math.min(100, shuffled.length));

    let notifiedCount = 0;
    for (const user of selectedUsers) {
      const userObjectId = new mongoose.Types.ObjectId(user.userId);

      // Check rate limiting - max 2 notifications per day
      const recentNotificationCount = await Notification.countDocuments({
        userId: userObjectId,
        type: { $in: ['wishlist_update', 'watchlater_update'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (recentNotificationCount >= MAX_NOTIFICATIONS_PER_USER_PER_DAY) {
        continue;
      }

      // Check minimum time between notifications
      const lastNotification = await Notification.findOne({
        userId: userObjectId,
        type: { $in: ['wishlist_update', 'watchlater_update'] }
      }).sort({ createdAt: -1 });

      if (lastNotification) {
        const hoursSinceLastNotification = (new Date() - lastNotification.createdAt) / (1000 * 60 * 60);
        if (hoursSinceLastNotification < MIN_HOURS_BETWEEN_NOTIFICATIONS) {
          continue;
        }
      }

      // Don't notify users who recently logged in
      const userRecentLogin = nonAdminUsers.find(u => u._id.toString() === user.userId);
      if (userRecentLogin?.lastLogin) {
        const hoursSinceLogin = (new Date() - new Date(userRecentLogin.lastLogin)) / (1000 * 60 * 60);
        if (hoursSinceLogin < 1) {
          continue;
        }
      }

      // Determine which list to highlight
      const listType = user.wishlist > user.watchLater ? 'wishlist' : 'watchlater';
      const count = listType === 'wishlist' ? user.wishlist : user.watchLater;
      
      // Get sample media for rich notification
      const [sampleMedia] = listType === 'wishlist' 
        ? await Wishlist.find({ user: userObjectId }).populate('media').limit(1)
        : await WatchLater.find({ user: userObjectId }).populate('media').limit(1);

      const message = getRandomMessage(count);
      
      // Prevent duplicate notifications within 1 minute
      const existingNotification = await Notification.findOne({
        userId: userObjectId,
        type: listType === 'wishlist' ? 'wishlist_update' : 'watchlater_update',
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
      });

      if (!existingNotification) {
        const notification = await Notification.create({
          type: listType === 'wishlist' ? 'wishlist_update' : 'watchlater_update',
          title: REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)],
          message,
          userId: userObjectId,
          tmdbId: sampleMedia?.media?.tmdbId,
          mediaType: sampleMedia?.media?.mediaType,
          mediaTitle: sampleMedia?.media?.title,
          mediaPoster: sampleMedia?.media?.posterPath,
        });

        // Send real-time notification via Socket.IO
        io.to(userObjectId.toString()).emit('user-notification', notification);
        notifiedCount++;
      }
    }

    console.log(`[NotificationReminder] Sent real-time reminders to ${notifiedCount} users`);
  } catch (error) {
    console.error('[NotificationReminder] Error:', error);
  }
};

// Schedule job to run at 9 AM and 6 PM daily
cron.schedule('0 9,18 * * *', () => {
  console.log('[NotificationReminder] Running scheduled reminder at 9 AM & 6 PM...');
  sendReminderNotifications();
});

export default sendReminderNotifications;
export { sendReminderNotifications };
