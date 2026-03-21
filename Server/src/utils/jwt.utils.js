// utils/jwt.util.js
import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const generateUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  role: user.role,
});
