const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOTP = require("../utils/sendOTP");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    console.log("Register attempt", req.body);
    const { name, email, password, role = "customer", adminCode, phone, city, country, gender } = req.body;

    console.log("Register payload:", { name, email, role, adminCode, phone, city, country, gender });

    const adminCodeClean = (adminCode || "").toString().trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Enforce admin-only registration path
    if (role === "admin") {
      if (!adminCodeClean || adminCodeClean !== process.env.ADMIN_REG_CODE) {
        return res.status(403).json({ message: "Admin registration code is invalid" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      city: city || "",
      country: country || "India",
      gender: gender || ""
    };

    if (role === "admin") {
      userData.isAdminVerified = false;
      userData.emailVerified = false;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      userData.otp = otp;
      userData.otpExpires = Date.now() + 5 * 60 * 1000;

      const newAdmin = await User.create(userData);
      await sendOTP(email, otp);

      return res.json({
        message: "Admin registration created. OTP sent for verification.",
        email: newAdmin.email,
        role: "admin",
        needsOTP: true
      });
    }

    // customer registration (quick, non-OTP)
    userData.emailVerified = true;
    userData.isAdminVerified = false;

    await User.create(userData);

    res.json({ message: "Customer registered successfully" });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= LOGIN + SEND OTP =================
exports.login = async (req, res) => {
  try {
    const { email, password, role = "customer" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (role !== user.role) {
      return res.status(403).json({ message: "Access denied for this role" });
    }

    if (user.role === "admin" && !user.isAdminVerified) {
      return res.status(403).json({ message: "Admin account not verified. Complete OTP verification first." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Send OTP for every login attempt (2FA)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendOTP(email, otp);

    res.json({ message: "OTP sent to email", role: user.role });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message || "Failed to send OTP" });
  }
};

// ================= RESEND OTP (role-based)
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp);

    res.json({ message: "OTP resent successfully", role: user.role });
  } catch (error) {
    console.log("Resend OTP Error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Ensure both OTPs are strings and trimmed for comparison
    const incomingOtp = String(otp).trim();
    const storedOtp = String(user.otp).trim();

    console.log("OTP comparison - Incoming:", incomingOtp, "Stored:", storedOtp, "Match:", incomingOtp === storedOtp);
    console.log("OTP Expiry - Current:", Date.now(), "Expires:", user.otpExpires, "Valid:", user.otpExpires >= Date.now());

    if (!incomingOtp || incomingOtp !== storedOtp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.role === "admin") {
      // mark admin verified during registration OTP phase
      user.isAdminVerified = true;
    }

    user.emailVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      role: user.role
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= GET USER PROFILE =================
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpires");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= UPDATE USER PROFILE =================
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode, country, profilePicture } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (zipCode) user.zipCode = zipCode;
    if (country) user.country = country;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      success: true,
      message: "✅ Profile updated successfully",
      user: {
        ...user.toObject(),
        password: undefined,
        otp: undefined,
        otpExpires: undefined
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= GET ALL USERS (ADMIN ONLY) =================
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find({ role: "customer" }).select("-password -otp -otpExpires -isAdminVerified");
    
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};