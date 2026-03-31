import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import catchAsync from "../utils/catchAsync.js";

export const getNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { type: { $in: ["login", "register", "suspicious", "admin_action"] } };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, read: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    unreadCount,
  });
});

export const getUnreadCount = catchAsync(async (req, res, next) => {
  const query = { type: { $in: ["login", "register", "suspicious", "admin_action"] } };
  const unreadCount = await Notification.countDocuments({ ...query, read: false });
  res.json({ success: true, unreadCount });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { returnDocument: 'after' }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

export const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ read: false }, { read: true });

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

export const deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification deleted",
  });
});

export const deleteAllNotifications = catchAsync(async (req, res, next) => {
  await Notification.deleteMany({});

  res.json({
    success: true,
    message: "All notifications deleted",
  });
});

export const getNotificationsByType = catchAsync(async (req, res, next) => {
  const { type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = type ? { type } : {};

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getUserNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id).select('lastLogin');
  const lastLogin = user?.lastLogin || new Date();

  const query = { 
    userId: req.user._id,
    createdAt: { $gte: lastLogin }
  };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, read: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    unreadCount,
  });
});

export const getUserUnreadCount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('lastLogin');
  const lastLogin = user?.lastLogin || new Date();

  const unreadCount = await Notification.countDocuments({ 
    userId: req.user._id, 
    read: false,
    createdAt: { $gte: lastLogin }
  });
  res.json({ success: true, unreadCount });
});

export const markUserNotificationAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { read: true },
    { returnDocument: 'after' }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

export const markAllUserNotificationsAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});
