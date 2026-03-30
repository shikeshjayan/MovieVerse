import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protect = async (req, res, next) => {
  let token;

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    if (req.user.isBanned) {
      return res
        .status(403)
        .json({ success: false, message: "Your account has been banned", banReason: req.user.banReason });
    }

    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Session expired, please login again"
        : "Not authorized, token failed";

    res.status(401).json({ success: false, message });
  }
};

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
