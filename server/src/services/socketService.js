import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookies from "cookie";
import User from "../models/user.model.js";

const activeUsers = new Map();

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
    pingTimeout: 60000,
    pingInterval: 25000,
  });

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

  io.on("connection", (socket) => {
    const userId = socket.user.userId.toString();
    const userEmail = socket.user.email;
    const username = socket.user.username;

    activeUsers.set(userId, {
      socketId: socket.id,
      email: userEmail,
      username: username,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    io.emit("active-users-update", activeUsers.size);

    socket.on("user-activity", () => {
      const user = activeUsers.get(userId);
      if (user) {
        user.lastActivity = new Date();
      }
    });

    socket.on("disconnect", () => {
      activeUsers.delete(userId);
      io.emit("active-users-update", activeUsers.size);
    });
  });

  return io;
};

export const emitNotification = (io, notification) => {
  io.emit("new-notification", notification);
};

export const emitSuspiciousAlert = (io, alert) => {
  io.emit("suspicious-alert", alert);
};

export const emitToUser = (io, userId, event, data) => {
  const user = activeUsers.get(userId.toString());
  if (user) {
    io.to(user.socketId).emit(event, data);
  }
};

export const emitUserNotification = (io, userId, notification) => {
  emitToUser(io, userId.toString(), "user-notification", notification);
};

export const getActiveUsersCount = () => activeUsers.size;

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
