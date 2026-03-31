import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const activeUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://movieverse-ai.vercel.app",
        "https://movieverse-s4e9.onrender.com",
        /^https:\/\/movieverse-.*\.onrender\.com$/,
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;
    const userEmail = socket.user.email;

    activeUsers.set(userId, {
      socketId: socket.id,
      email: userEmail,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    io.emit("active-users-update", activeUsers.size);

    socket.on("disconnect", () => {
      activeUsers.delete(userId);
      io.emit("active-users-update", activeUsers.size);
    });

    socket.on("user-activity", () => {
      const user = activeUsers.get(userId);
      if (user) {
        user.lastActivity = new Date();
      }
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
    connectedAt: data.connectedAt,
    lastActivity: data.lastActivity,
  }));
};