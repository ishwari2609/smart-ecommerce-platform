const express = require("express");
const router = express.Router();

const {
  register,
  login,
  resendOTP,
  verifyOTP,
  getUserProfile,
  updateUserProfile,
  getAllUsers
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/resend-otp", resendOTP);
router.post("/verify-otp", verifyOTP);

// Protected routes
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.get("/all-users", verifyToken, getAllUsers);

module.exports = router;