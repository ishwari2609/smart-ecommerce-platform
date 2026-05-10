const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ✅ ROUTES
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");

// ✅ MODEL (IMPORTANT for test insert)
const User = require("./models/User");
const Product = require("./models/Product");

const app = express();

/* ================= MIDDLEWARE ================= */
// ✅ Simple CORS configuration
app.use(cors());
app.use(express.json());

/* ================= MONGODB CONNECTION ================= */
if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);

/* ================= TEST ROUTE (FOR DB CREATION) ================= */
app.get("/create-test", async (req, res) => {
  try {
    const user = await User.create({
      name: "Test User",
      email: "test@gmail.com",
      password: "123456",
      role: "customer",
      isAdminVerified: true,
      emailVerified: true,
    });

    res.json({ message: "Test user created", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* ================= CLEANUP ROUTE (REMOVE OLD PRODUCTS) ================= */
app.get("/cleanup-products", async (req, res) => {
  try {
    console.log("🧹 [CLEANUP] Starting AGGRESSIVE product database cleanup...");
    
    // Get all products
    const allProducts = await Product.find();
    console.log(`📦 [CLEANUP] Found ${allProducts.length} total products in database`);
    
    // STRICT: Keep ONLY these exact products
    const productsToKeep = {
      "bowl": true,
      "plate": true,
      "glass": true
    };
    
    // Find products that DON'T match the keep list
    const productsToDelete = allProducts.filter(p => {
      const productNameLower = p.name.toLowerCase();
      const productCategoryLower = p.category.toLowerCase();
      
      // Keep if name contains bowl, plate, or glass
      const shouldKeep = Object.keys(productsToKeep).some(keyword => 
        productNameLower.includes(keyword) || productCategoryLower.includes(keyword)
      );
      
      return !shouldKeep;
    });
    
    console.log(`\n📋 [CLEANUP] Products in database:`);
    allProducts.forEach(p => {
      const willDelete = productsToDelete.some(dp => dp._id.toString() === p._id.toString());
      console.log(`  ${willDelete ? '🗑️ DELETE' : '✅ KEEP'}: ${p.name} (${p.category})`);
    });
    
    // Delete old products
    if (productsToDelete.length > 0) {
      const deleteIds = productsToDelete.map(p => p._id);
      const deleteResult = await Product.deleteMany({
        _id: { $in: deleteIds }
      });
      
      console.log(`\n🗑️ [CLEANUP] Deleted ${deleteResult.deletedCount} products`);
    }
    
    // Get remaining products
    const remaining = await Product.find();
    console.log(`\n✅ [CLEANUP] FINAL STATUS:`);
    console.log(`   Total Products: ${remaining.length}`);
    console.log(`   Products:`);
    remaining.forEach(p => {
      console.log(`   ✓ ${p.name} (${p.category}) - $${p.price}`);
    });
    
    res.json({ 
      message: "✅ Cleanup complete - Analytics will now show ONLY your 3 products",
      deleted: productsToDelete.length,
      remaining: remaining.length,
      products: remaining.map(p => ({ 
        name: p.name, 
        category: p.category,
        price: p.price
      }))
    });
  } catch (err) {
    console.error("❌ [CLEANUP] Error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ================= VERIFY PRODUCTS ROUTE ================= */
app.get("/verify-products", async (req, res) => {
  try {
    const products = await Product.find().select('name category price discountPercent');
    
    console.log(`📊 [VERIFY] Database contains ${products.length} products:`);
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.category}) - $${p.price}`);
    });
    
    res.json({ 
      total: products.length,
      products: products.map(p => ({
        name: p.name,
        category: p.category,
        price: p.price
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});