import cron from 'node-cron';
import mongoose from 'mongoose';
import Wishlist from '../models/wishlist.model.js';
import WatchLater from '../models/watchLater.model.js';
import Notification from '../models/notification.model.js';
import Media from '../models/media.model.js';
import User from '../models/user.model.js';

const REMINDER_MESSAGES = [
  "You have some items waiting for you!",
  "Time to catch up on your watchlist!",
  "Your watchlater list is waiting!",
  "Don't forget about your saved movies!",
  "Ready for movie night?",
];

const getRandomMessage = (count, title) => {
  const messages = [
    `You have ${count} item${count > 1 ? 's' : ''} in your watchlater. Let's watch!`,
    `Your watchlater has ${count} movie${count > 1 ? 's' : ''} waiting for you!`,
    `Don't miss out! You have ${count} item${count > 1 ? 's' : ''} saved.`,
    `Time to watch something! ${count} item${count > 1 ? 's' : ''} on your list.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

const sendReminderNotifications = async () => {
  try {
    const usersWithWishlist = await Wishlist.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const usersWithWatchLater = await WatchLater.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const userLists = new Map();
    
    usersWithWishlist.forEach(u => {
      userLists.set(u._id.toString(), { wishlist: u.count, watchLater: 0 });
    });
    
    usersWithWatchLater.forEach(u => {
      const existing = userLists.get(u._id.toString()) || { wishlist: 0 };
      existing.watchLater = u.count;
      userLists.set(u._id.toString(), existing);
    });

    const usersToNotify = [];
    userLists.forEach((lists, userId) => {
      const total = lists.wishlist + lists.watchLater;
      if (total >= 1) {
        usersToNotify.push({ userId, ...lists, total });
      }
    });

    // Get all non-admin users
    const nonAdminUsers = await User.find({ role: { $ne: 'admin' } }).select('_id').lean();
    const nonAdminUserIds = new Set(nonAdminUsers.map(u => u._id.toString()));
    const filteredUsers = usersToNotify.filter(u => nonAdminUserIds.has(u.userId));

    const shuffled = filteredUsers.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, Math.min(100, shuffled.length));

    for (const user of selectedUsers) {
      const userObjectId = new mongoose.Types.ObjectId(user.userId);
      const listType = user.wishlist > user.watchLater ? 'wishlist' : 'watchlater';
      const count = listType === 'wishlist' ? user.wishlist : user.watchLater;
      
      const [sampleMedia] = listType === 'wishlist' 
        ? await Wishlist.find({ user: userObjectId }).populate('media').limit(1)
        : await WatchLater.find({ user: userObjectId }).populate('media').limit(1);

      const message = getRandomMessage(count);
      
      const existingNotification = await Notification.findOne({
        userId: userObjectId,
        type: listType === 'wishlist' ? 'wishlist_update' : 'watchlater_update',
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
      });

      if (!existingNotification) {
        await Notification.create({
          type: listType === 'wishlist' ? 'wishlist_update' : 'watchlater_update',
          title: REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)],
          message,
          userId: userObjectId,
          tmdbId: sampleMedia?.media?.tmdbId,
          mediaType: sampleMedia?.media?.mediaType,
          mediaTitle: sampleMedia?.media?.title,
          mediaPoster: sampleMedia?.media?.posterPath,
        });
      }
    }

    console.log(`[NotificationReminder] Sent reminders to ${selectedUsers.length} users`);
  } catch (error) {
    console.error('[NotificationReminder] Error:', error);
  }
};

cron.schedule('* * * * *', () => {
  console.log('[NotificationReminder] Running every minute...');
  sendReminderNotifications();
});

export default sendReminderNotifications;
export { sendReminderNotifications };
