/**
 * JWT utility functions for authentication
 * Handles token generation and user response formatting
 */
import jwt from "jsonwebtoken";

/**
 * Generate JWT token for authenticated users
 * @param {Object} payload - Token payload containing user data
 * @returns {string} Signed JWT token (expires in 7 days)
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Format user data for API responses (excludes sensitive fields)
 * @param {Object} user - User document from database
 * @returns {Object} Sanitized user object for client
 */
export const generateUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  role: user.role,
  avatar: user.avatar || "",
});
