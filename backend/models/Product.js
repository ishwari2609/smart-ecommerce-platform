const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "misc" },
  company: { type: String, default: "Generic" },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  bought: { type: String, default: "0 bought" },
  delivery: { type: String, default: "FREE delivery" },
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);