const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const sendOTP = require("../utils/sendOTP");

// ================= CREATE / UPDATE PRODUCT =================
const createOrUpdateProduct = async (req, res) => {
  const payload = req.body;

  try {
    // 🔄 UPDATE
    if (payload.id) {
      const existing = await Product.findById(payload.id);
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Track if price or discount changed for automatic notifications
      const oldPrice = existing.price;
      const oldDiscount = existing.discountPercent;
      const wasOutOfStock = !existing.inStock;

      // Normalize category: capitalize first letter
      const categoryName = payload.category 
        ? payload.category.charAt(0).toUpperCase() + payload.category.slice(1).toLowerCase()
        : existing.category;

      // ✅ assign values safely
      existing.name = payload.name || existing.name;
      existing.category = categoryName;
      existing.company = payload.company || existing.company || "Generic";
      existing.description = payload.description || existing.description;
      existing.price = payload.price ?? existing.price;
      existing.cost = payload.cost ?? existing.cost;

      // ✅ FIXED FIELD NAMES
      if (payload.discountPercent !== undefined) {
        existing.discountPercent = payload.discountPercent;
      }

      if (payload.inStock !== undefined) {
        existing.inStock = payload.inStock;
      }

      if (payload.quantity !== undefined) {
        existing.quantity = payload.quantity;
      }

      if (payload.image || payload.images) {
        existing.images = payload.image
          ? [payload.image]
          : payload.images;
      }

      await existing.save();

      // 📧 Send automatic recommendations if price or discount changed
      if (oldPrice !== existing.price || oldDiscount !== existing.discountPercent) {
        try {
          await sendOTP.notifyCustomersAboutPriceChange(existing, {
            oldPrice,
            oldDiscount,
            newPrice: existing.price,
            newDiscount: existing.discountPercent
          });
        } catch (notifyErr) {
          console.warn("⚠️ Price change notification failed (non-critical):", notifyErr.message);
        }
      }

      // 📧 Send stock availability notification if product came back in stock from wishlist
      if (wasOutOfStock && existing.inStock) {
        try {
          const usersWithWishlist = await User.find({
            wishlist: existing._id
          }).select('name email');

          if (usersWithWishlist.length > 0) {
            console.log(`📨 Notifying ${usersWithWishlist.length} users about ${existing.name} back in stock`);
            await sendOTP.notifyUsersAboutStockAvailability(existing, usersWithWishlist);
          } else {
            console.log(`📭 No users with ${existing.name} in wishlist`);
          }
        } catch (stockNotifyErr) {
          console.warn("⚠️ Stock availability notification failed (non-critical):", stockNotifyErr.message);
        }
      }

      return res.json({
        message: "Product updated",
        product: existing,
      });
    }

    // ➕ CREATE
    // Normalize category
    const categoryName = payload.category 
      ? payload.category.charAt(0).toUpperCase() + payload.category.slice(1).toLowerCase()
      : "General";

    const product = new Product({
      name: payload.name,
      category: categoryName,
      company: payload.company || "Generic",
      description: payload.description,
      price: payload.price,
      cost: payload.cost,

      // ✅ FIXED
      discountPercent: payload.discountPercent || payload.discount || 0,

      // ✅ FIXED
      images: payload.image
        ? [payload.image]
        : payload.images || [],

      inStock: payload.inStock !== undefined ? payload.inStock : true,
      quantity: payload.quantity !== undefined ? payload.quantity : 100,
    });

    await product.save();

    return res.status(201).json({
      message: "Product created",
      product,
    });

  } catch (error) {
    console.error("❌ REAL ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LIST PRODUCTS =================
const listProducts = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️ [PRODUCTS] Database connection not ready");
      return res.status(503).json({
        message: "Database connection not ready",
        products: []
      });
    }

    // ONLY get products from database - STRICT mode
    const products = await Product.find().sort({ createdAt: -1 });

    if (!Array.isArray(products)) {
      console.error("❌ [PRODUCTS] Invalid products data from database");
      return res.status(500).json({
        message: "Invalid database response",
        products: []
      });
    }

    console.log(`📦 [PRODUCTS] Found ${products.length} products in database`);
    
    if (products.length === 0) {
      console.warn("⚠️ [PRODUCTS] No products in database");
      return res.json({ 
        products: [],
        count: 0,
        message: "Database is empty",
        timestamp: new Date().toISOString()
      });
    }

    return res.json({ 
      products,
      count: products.length,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ [PRODUCTS] Error listing products:", error.message);
    console.error("❌ [PRODUCTS] Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products: " + error.message,
      products: []
    });
  }
};

// ================= GET PRODUCT =================
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE PRODUCT =================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= NOTIFY CUSTOMERS =================
const notifyCustomers = async (req, res) => {
  const { product } = req.body;

  if (!product || !product.name) {
    return res.status(400).json({
      message: "Product data is required",
    });
  }

  try {
    const customers = await User.find({ role: "customer" });

    await Promise.all(
      customers.map((customer) =>
        sendOTP.sendProductInfo(customer.email, product)
      )
    );

    return res.json({
      message: "Product notification sent to customers",
    });
  } catch (error) {
    console.error("Error notifying customers:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= WATCH PRODUCT =================
const watchProduct = async (req, res) => {
  const { email, productId, productName, category } = req.body;

  if (!email || !productId) {
    console.error("❌ [WATCH] Missing required fields:", { email: !!email, productId: !!productId });
    return res.status(400).json({
      message: "Email and productId are required",
    });
  }

  try {
    console.log("📊 [WATCH] Processing watch tracker for:", { email, productId, productName, category });
    
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      console.error("❌ [WATCH] User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // Normalize category: capitalize first letter, rest lowercase
    const categoryName = category 
      ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      : "General";

    // Convert to string for consistent matching
    const productIdStr = String(productId);
    
    const existing = user.watchHistory?.find(
      (item) => String(item.productId) === productIdStr
    );

    if (existing) {
      existing.views += 1;
      existing.lastViewed = new Date();
      existing.category = categoryName;
      console.log(`✅ [WATCH] Incremented views for product ${productIdStr} to ${existing.views}`);
    } else {
      user.watchHistory = user.watchHistory || [];
      user.watchHistory.push({
        productId: productIdStr,
        productName,
        category: categoryName,
        views: 1,
        lastViewed: new Date(),
      });
      console.log(`✅ [WATCH] Added new product ${productIdStr} to watch history`);
    }

    await user.save();
    
    const finalCount = user.watchHistory.find(item => String(item.productId) === productIdStr)?.views || 1;
    console.log(`✅ [WATCH] SUCCESS - Product ${productIdStr} now has ${finalCount} views`);

    return res.json({
      message: "Watch history updated",
      watchCount: finalCount,
      totalWatchedItems: user.watchHistory.length
    });

  } catch (error) {
    console.error("❌ [WATCH] Error updating watch history:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= ANALYTICS =================
const getWatchAnalytics = async (req, res) => {
  try {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n📊 [ANALYTICS] Starting analysis at ${timestamp}`);
    console.log(`📊 [ANALYTICS] User: ${req.user?.email}, Role: ${req.user?.role}`);

    // Verify user is admin
    if (!req.user || req.user.role !== "admin") {
      console.error("❌ [ANALYTICS] Unauthorized - user is not admin");
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    
    // Get ALL products currently in inventory
    const allProducts = await Product.find().select('_id name category');
    const validProductIds = new Set(allProducts.map(p => String(p._id)));
    
    console.log(`📋 [ANALYTICS] Current inventory has ${allProducts.length} products:`);
    allProducts.forEach(p => console.log(`   • ${p.name} (${p.category})`));
    
    // Get all customers with watch history
    const users = await User.find(
      { role: "customer" },
      "name email watchHistory"
    );

    console.log(`👥 [ANALYTICS] Found ${users.length} customers`);

    if (!users || users.length === 0) {
      console.log("⚠️ [ANALYTICS] No customers found");
      return res.json({
        success: true,
        products: [],
        totalCustomers: 0,
        totalProducts: 0,
        message: "No customers with watch history found",
        timestamp: timestamp
      });
    }

    const productMap = {};
    let totalViews = 0;

    users.forEach((user) => {
      if (!Array.isArray(user.watchHistory) || user.watchHistory.length === 0) return;

      user.watchHistory.forEach((item) => {
        // STRICT: Only count if product exists in current inventory
        if (!validProductIds.has(String(item.productId))) {
          console.log(`   ⚠️ Skipping old product: ${item.productName} (not in inventory)`);
          return;
        }

        const key = String(item.productId);
        
        const category = item.category 
          ? item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()
          : "General";

        if (!productMap[key]) {
          productMap[key] = {
            productId: String(item.productId),
            productName: item.productName || "-",
            category: category,
            totalViews: 0,
            customerViews: [],
          };
        }

        const views = item.views || 1;
        productMap[key].totalViews += views;
        totalViews += views;

        // Check if customer already listed for this product
        const existingCustomer = productMap[key].customerViews.find(cv => cv.email === user.email);
        if (existingCustomer) {
          existingCustomer.views = views; // Update with latest view count
        } else {
          productMap[key].customerViews.push({
            email: user.email,
            views: views,
            lastViewed: item.lastViewed,
          });
        }
      });
    });

    const sortedProducts = Object.values(productMap).sort((a, b) => b.totalViews - a.totalViews);
    
    console.log(`✅ [ANALYTICS FINAL]`);
    console.log(`   Products Tracked: ${sortedProducts.length}`);
    console.log(`   Total Views: ${totalViews}`);
    console.log(`   Customers: ${users.length}`);
    sortedProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.productName} → ${p.totalViews} views`);
    });

    return res.json({
      success: true,
      products: sortedProducts,
      totalCustomers: users.length,
      totalProducts: sortedProducts.length,
      totalViews: totalViews,
      timestamp: timestamp,
      lastFetched: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching watch analytics:", error);
    console.error("❌ [ANALYTICS] Error details:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch analytics"
    });
  }
};

// ================= NOTIFY CUSTOMERS BY WATCH HISTORY =================
const notifyCustomersByWatchHistory = async (req, res) => {
  const { productId, productName, category } = req.body;

  if (!productId || !productName) {
    return res.status(400).json({
      message: "productId and productName are required",
    });
  }

  try {
    // Find customers who have watched this product or similar category
    const productIdStr = String(productId);
    
    const customers = await User.find({
      role: "customer",
      $or: [
        { "watchHistory.productId": productIdStr },
        { "watchHistory.category": category || "General" }
      ]
    });

    if (customers.length === 0) {
      return res.json({
        message: "No customers found with watch history for this product",
        notifiedCount: 0
      });
    }

    await Promise.all(
      customers.map((customer) =>
        sendOTP.sendProductInfo(customer.email, { productId: productIdStr, productName, category })
      )
    );

    return res.json({
      message: `Product notification sent to ${customers.length} customers`,
      notifiedCount: customers.length
    });
  } catch (error) {
    console.error("Error notifying customers:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= CATEGORY MANAGEMENT =================
const Category = require("../models/Category");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  const { name, icon, description } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  try {
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category = new Category({
      name: name.trim(),
      icon: icon || "📦",
      description: description || "",
    });

    await category.save();

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  const { name, icon, description } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if another category with the same name already exists
    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({
        message: "Category name already exists",
      });
    }

    category.name = name.trim();
    category.icon = icon || category.icon;
    category.description = description || category.description;

    await category.save();

    return res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= RECOMMENDATION SYSTEM =================
const recommendationService = require("../services/recommendationService");

/**
 * Get personalized recommendations for the logged-in customer
 */
const getMyRecommendations = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      email
    );

    if (!recommendations) {
      return res.status(404).json({
        message: "No watch history found for recommendations",
      });
    }

    return res.json({
      message: "Recommendations generated successfully",
      recommendations,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Send recommendation email to a customer (admin triggered)
 */
const sendRecommendationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      email
    );

    if (!recommendations) {
      return res.json({
        message: "No recommendations available for this customer",
      });
    }

    // Send email
    await sendOTP.sendRecommendations(email, recommendations);

    return res.json({
      message: `Recommendation email sent to ${email}`,
      recommendationCount:
        recommendations.wheeledSpecialProducts.length +
        recommendations.wishlishPriceDrops.length +
        recommendations.newStockArrivals.length,
    });
  } catch (error) {
    console.error("Error sending recommendation email:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Send recommendations to all customers (admin triggered)
 */
const sendBulkRecommendations = async (req, res) => {
  try {
    const results = await recommendationService.generateRecommendationsForAllCustomers();

    // Send emails for all customers
    const emailPromises = [];
    for (const result of results) {
      const recs = await recommendationService.generatePersonalizedRecommendations(
        result.email
      );
      if (recs) {
        emailPromises.push(sendOTP.sendRecommendations(result.email, recs));
      }
    }

    await Promise.all(emailPromises);

    return res.json({
      message: `Recommendation emails sent to ${results.length} customers`,
      customersSent: results.length,
      details: results,
    });
  } catch (error) {
    console.error("Error bulk sending recommendations:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Get watch preferences analytics (admin)
 */
const getCustomerPreferences = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const preferences = await recommendationService.analyzeCustomerPreferences(
      email
    );

    // Return even if no watch history (return empty preferences)
    if (!preferences) {
      return res.json({
        message: "Customer found but no watch history yet",
        preferences: {
          email: email.toLowerCase().trim(),
          topCategories: [],
          totalWatches: 0,
          wishlistCount: 0,
          wishlistItems: [],
        },
      });
    }

    return res.json({
      message: "Customer preferences analyzed",
      preferences,
    });
  } catch (error) {
    console.error("Error analyzing preferences:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ================= WISHLIST OPERATIONS =================
/**
 * Add product to customer's wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const { email, productId } = req.body;

    if (!email || !productId) {
      return res.status(400).json({
        message: "Email and productId are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert to ObjectId for comparison
    const productObjectId = product._id;

    // Check if already in wishlist
    const alreadyInWishlist = user.wishlist?.some(
      (id) => String(id) === String(productObjectId)
    );

    if (alreadyInWishlist) {
      return res.json({
        message: "Product already in wishlist",
        wishlistCount: user.wishlist.length,
      });
    }

    // Add to wishlist
    user.wishlist = user.wishlist || [];
    user.wishlist.push(productObjectId);
    await user.save();

    return res.json({
      message: "Product added to wishlist",
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Remove product from customer's wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { email, productId } = req.body;

    if (!email || !productId) {
      return res.status(400).json({
        message: "Email and productId are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist?.filter(
      (id) => String(id) !== String(productId)
    );
    await user.save();

    return res.json({
      message: "Product removed from wishlist",
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Get customer's wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).populate("wishlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Wishlist retrieved",
      wishlistItems: user.wishlist || [],
      wishlistCount: user.wishlist ? user.wishlist.length : 0,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createOrUpdateProduct,
  listProducts,
  getProduct,
  deleteProduct,
  notifyCustomers,
  notifyCustomersByWatchHistory,
  watchProduct,
  getWatchAnalytics,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMyRecommendations,
  sendRecommendationEmail,
  sendBulkRecommendations,
  getCustomerPreferences,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};