/**
 * Authentication middleware for protected routes
 * Verifies JWT tokens and attaches user to request object
 */
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware to protect routes - verifies JWT and checks user status
 * Attaches user object to req.user if authentication successful
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from cookie or Authorization header
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, please login" });
  }

  try {
    // Verify token and extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database, exclude password field
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    // Check if user account is banned
    if (req.user.isBanned) {
      return res
        .status(403)
        .json({ success: false, message: "Your account has been banned", banReason: req.user.banReason });
    }

    // Check if user account is deactivated
    if (req.user.isActive === false) {
      return res
        .status(403)
        .json({ success: false, message: "Your account has been deactivated. Contact admin for assistance." });
    }

    next();
  } catch (error) {
    // Provide specific error messages for token issues
    const message =
      error.name === "TokenExpiredError"
        ? "Session expired, please login again"
        : "Not authorized, token failed";

    res.status(401).json({ success: false, message });
  }
};

/**
 * Middleware to restrict routes to admin users only
 * Must be used after 'protect' middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ success: false, message: "Access denied: Admins only" });
  }
};

export { protect, admin };
