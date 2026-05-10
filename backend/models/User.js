const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  },
  isAdminVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpires: Date,
  watchHistory: [
    {
      productId: String,
      productName: String,
      category: {
        type: String,
        default: "General"
      },
      views: {
        type: Number,
        default: 0
      },
      lastViewed: Date
    }
  ],
  // Profile Information
  profilePicture: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  },
  state: {
    type: String,
    default: ""
  },
  zipCode: {
    type: String,
    default: ""
  },
  country: {
    type: String,
    default: "India"
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: ""
  },
  // Wishlist - Array of product IDs
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User",userSchema);
