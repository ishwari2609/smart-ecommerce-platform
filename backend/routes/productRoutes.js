const express = require("express");
const router = express.Router();

// CONTROLLER
const productController = require("../controllers/productController");

// ✅ CORRECT MIDDLEWARE IMPORT (NO FALLBACK)
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
console.log("✅ Product routes loaded");
// ================= ROUTES =================

// Public routes
router.get("/", productController.listProducts);
router.get("/categories", productController.getAllCategories);
router.post("/watch", productController.watchProduct);

// Wishlist routes (Customer/Public)
router.post("/wishlist/add", productController.addToWishlist);
router.post("/wishlist/remove", productController.removeFromWishlist);
router.get("/wishlist/get", productController.getWishlist);

// Protected analytics routes (Admin)
router.get("/watch-analytics", verifyToken, requireAdmin, productController.getWatchAnalytics);

// Recommendation routes (Customer)
router.get("/recommendations/my", verifyToken, productController.getMyRecommendations);

// Recommendation routes (Admin)
router.post("/recommendations/send", verifyToken, requireAdmin, productController.sendRecommendationEmail);
router.post("/recommendations/bulk", verifyToken, requireAdmin, productController.sendBulkRecommendations);
router.get("/recommendations/preferences", verifyToken, requireAdmin, productController.getCustomerPreferences);

// Protected admin routes - must come before :id routes
router.post("/", verifyToken, requireAdmin, productController.createOrUpdateProduct);
router.post("/notify", verifyToken, requireAdmin, productController.notifyCustomers);
router.post("/notify-history", verifyToken, requireAdmin, productController.notifyCustomersByWatchHistory);
router.post("/category/add", verifyToken, requireAdmin, productController.createCategory);

// Category operations (Admin)
router.put("/category/:id", verifyToken, requireAdmin, productController.updateCategory);
router.delete("/category/:id", verifyToken, requireAdmin, productController.deleteCategory);

// Product detail and deletion - after specific routes
router.get("/:id", productController.getProduct);
router.put("/:id", verifyToken, requireAdmin, productController.createOrUpdateProduct);
router.delete("/:id", verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;