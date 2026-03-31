import express from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationsByType,
} from "../controllers/notification.controller.js";
import { protect, admin } from "../middlewares/authMiddleware.js";
import { sendReminderNotifications } from "../jobs/notificationReminderJob.js";
import { getActiveUsersList, getActiveUsersCount } from "../services/socketService.js";

export const adminRouter = express.Router();

adminRouter.get("/stats", protect, admin, getAdminStats);

adminRouter.get("/active-users", protect, admin, (req, res) => {
  res.json({
    success: true,
    count: getActiveUsersCount(),
    users: getActiveUsersList(),
  });
});

adminRouter.get("/notifications", protect, admin, getNotifications);
adminRouter.get("/notifications/unread-count", protect, admin, getUnreadCount);
adminRouter.get("/notifications/filter", protect, admin, getNotificationsByType);
adminRouter.patch("/notifications/:id/read", protect, admin, markAsRead);
adminRouter.patch("/notifications/read-all", protect, admin, markAllAsRead);
adminRouter.delete("/notifications/:id", protect, admin, deleteNotification);
adminRouter.delete("/notifications", protect, admin, deleteAllNotifications);

adminRouter.post("/trigger-reminder", protect, admin, async (req, res) => {
  try {
    await sendReminderNotifications();
    res.json({ success: true, message: "Reminder notifications sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
