/**
 * Socket.IO Service for real-time features
 * Handles WebSocket connections, auth, and real-time notifications
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookies from "cookie";
import User from "../models/user.model.js";

// Track active WebSocket connections
const activeUsers = new Map();

/**
 * Initialize Socket.IO server with authentication middleware
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Configured Socket.IO server
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:3000",
          "https://movieverse-ai.vercel.app",
          "https://movieverse-s4e9.onrender.com",
        ];
        const isAllowed = allowedOrigins.some(allowed => 
          origin === allowed || origin.startsWith(allowed)
        ) || origin.match(/^https:\/\/movieverse-.*\.onrender\.com$/);
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,  // 60 second ping timeout
    pingInterval: 25000,  // 25 second ping interval
  });

  // Authentication middleware - verify JWT before connection
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const parsedCookies = cookie.parse(cookieHeader);
      const token = parsedCookies.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("username email");
      
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user info to socket for later use
      socket.user = {
        userId: decoded.userId,
        email: user.email,
        username: user.username
      };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // Handle new connections
  io.on("connection", (socket) => {
    const userId = socket.user.userId.toString();
    const userEmail = socket.user.email;
    const username = socket.user.username;

    // Track active user
    activeUsers.set(userId, {
      socketId: socket.id,
      email: userEmail,
      username: username,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    // Broadcast updated user count to all clients
    io.emit("active-users-update", activeUsers.size);

    // Handle user activity pings
    socket.on("user-activity", () => {
      const user = activeUsers.get(userId);
      if (user) {
        user.lastActivity = new Date();
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      activeUsers.delete(userId);
      io.emit("active-users-update", activeUsers.size);
    });
  });

  return io;
};

/**
 * Emit notification to all connected clients
 * @param {Object} io - Socket.IO instance
 * @param {Object} notification - Notification data
 */
export const emitNotification = (io, notification) => {
  io.emit("new-notification", notification);
};

/**
 * Emit suspicious activity alert to admin
 * @param {Object} io - Socket.IO instance
 * @param {Object} alert - Alert data
 */
export const emitSuspiciousAlert = (io, alert) => {
  io.emit("suspicious-alert", alert);
};

/**
 * Emit event to specific user
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} data - Event payload
 */
export const emitToUser = (io, userId, event, data) => {
  const user = activeUsers.get(userId.toString());
  if (user) {
    io.to(user.socketId).emit(event, data);
  }
};

/**
 * Emit notification to specific user
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification data
 */
export const emitUserNotification = (io, userId, notification) => {
  emitToUser(io, userId.toString(), "user-notification", notification);
};

/**
 * Get count of currently active WebSocket connections
 */
export const getActiveUsersCount = () => activeUsers.size;

/**
 * Get list of all active users with their details
 */
export const getActiveUsersList = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    socketId: data.socketId,
    email: data.email,
    username: data.username || "",
    connectedAt: data.connectedAt,
    lastActivity: data.lastActivity,
  }));
};
