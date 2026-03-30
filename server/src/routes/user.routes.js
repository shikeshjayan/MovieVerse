import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  banUser,
  bulkBanUsers,
  bulkDeleteUsers,
  updatePreferences,
} from "../controllers/user.controller.js";
import {
  getUserNotifications,
  getUserUnreadCount,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
} from "../controllers/notification.controller.js";
import { admin, protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { userUpdateSchema } from "../utils/validationSchemas.js";

export const userRouter = express.Router();

userRouter.get("/", protect, admin, getAllUsers);
userRouter.get("/notifications", protect, getUserNotifications);
userRouter.get("/notifications/unread-count", protect, getUserUnreadCount);
userRouter.patch("/notifications/:id/read", protect, markUserNotificationAsRead);
userRouter.patch("/notifications/read-all", protect, markAllUserNotificationsAsRead);
userRouter.patch("/update-profile", protect, validate(userUpdateSchema), updateProfile);
userRouter.patch("/preferences", protect, updatePreferences);
userRouter.patch("/:id/ban", protect, admin, banUser);
userRouter.get("/:id", protect, admin, getUserById);
userRouter.put("/:id", protect, admin, validate(userUpdateSchema), updateUser);
userRouter.delete("/:id", protect, admin, deleteUser);
userRouter.post("/bulk-ban", protect, admin, bulkBanUsers);
userRouter.post("/bulk-delete", protect, admin, bulkDeleteUsers);
