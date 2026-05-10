const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.warn("⚠️ [AUTH] Authorization header missing");
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.warn("⚠️ [AUTH] Token missing from Authorization header");
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [AUTH] Token verified for user:", decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.warn("⚠️ [AUTH] User not found in database:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ [AUTH] User authenticated:", user.email, "Role:", user.role);
    req.user = user;

    next(); // ✅ MUST WORK
  } catch (err) {
    console.error("❌ [AUTH] Token verification failed:", err.message);
    if (err.name === "JsonWebTokenError") {
      console.error("❌ [AUTH] Invalid JWT format or signature");
    } else if (err.name === "TokenExpiredError") {
      console.error("❌ [AUTH] Token has expired");
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn("⚠️ [AUTH] Admin access denied for user:", req.user?.email, "Role:", req.user?.role);
    return res.status(403).json({ message: "Admin only" });
  }

  console.log("✅ [AUTH] Admin access granted for:", req.user.email);
  next(); // ✅ MUST WORK
};

module.exports = { verifyToken, requireAdmin };