const User = require("../models/User");
const Product = require("../models/Product");

/**
 * Analyze customer watch history and preferences
 * @param {string} email - Customer email
 * @returns {object} - Category preferences and recommendation data
 */
const analyzeCustomerPreferences = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate("wishlist");

    if (!user) {
      return null;
    }

    // Analyze watch history - group by category AND extract top products
    const categoryStats = {};
    let totalWatches = 0;
    const allWatchedProducts = []; // Store all products for sorting

    if (Array.isArray(user.watchHistory)) {
      user.watchHistory.forEach((item) => {
        // Normalize category
        const category = item.category 
          ? item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()
          : "General";
          
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            watchCount: 0,
            products: [],
            lastViewed: item.lastViewed,
          };
        }
        categoryStats[category].watchCount += item.views || 1;
        categoryStats[category].products.push({
          productId: item.productId,
          productName: item.productName,
          views: item.views || 1,
          lastViewed: item.lastViewed,
          category: category,
        });
        
        // Also collect for top products list
        allWatchedProducts.push({
          productId: item.productId,
          productName: item.productName,
          views: item.views || 1,
          lastViewed: item.lastViewed,
          category: category,
        });
        
        totalWatches += item.views || 1;
      });
    }

    // Sort categories by watch count
    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 3) // Top 3 categories
      .map((cat) => ({
        ...cat,
        percentage: totalWatches > 0 ? ((cat.watchCount / totalWatches) * 100).toFixed(1) : 0,
      }));

    // Sort products by views (descending) - top 5 most viewed products
    const topViewedProducts = allWatchedProducts
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      email: user.email,
      name: user.name,
      topCategories,
      topViewedProducts, // NEW: List of top 5 most viewed products
      totalWatches,
      wishlistCount: user.wishlist ? user.wishlist.length : 0,
      wishlistItems: user.wishlist || [],
    };
  } catch (error) {
    console.error("Error analyzing preferences:", error);
    return null;
  }
};

/**
 * Generate personalized recommendations for a customer
 * @param {string} email - Customer email
 * @returns {object} - Personalized recommendations with product details
 */
const generatePersonalizedRecommendations = async (email) => {
  try {
    const preferences = await analyzeCustomerPreferences(email);

    if (!preferences) {
      return null;
    }

    const recommendations = {
      email: preferences.email,
      customerName: preferences.name,
      topCategoryPreferences: preferences.topCategories,
      topViewedProducts: preferences.topViewedProducts || [], // NEW: Top 5 most viewed products
      wheeledSpecialProducts: [], // Category-based recommendations
      wishlishPriceDrops: [], // Wishlist items with price changes
      newStockArrivals: [], // New stock in favorite categories
      generatedAt: new Date(),
    };

    // Get product count for sorting/filtering
    const allProducts = await Product.find({ inStock: true }).lean();

    // 1. Find products in top categories (recently watched)
    if (preferences.topCategories.length > 0) {
      const topCategoryNames = preferences.topCategories.map((c) => c.category);

      // Get products from top categories
      const categoryProducts = await Product.find({
        category: { $in: topCategoryNames },
        inStock: true,
      })
        .limit(10)
        .lean();

      // Filter out already watched products and sort by stock
      const wheeled = categoryProducts
        .filter(
          (prod) =>
            !preferences.topCategories.some((cat) =>
              cat.products.some((p) => String(p.productId) === String(prod._id))
            )
        )
        .map((prod) => ({
          id: prod._id,
          name: prod.name,
          price: prod.price,
          originalPrice: prod.originalPrice,
          discount: prod.discount || 0,
          category: prod.category,
          stock: prod.quantity || prod.stock,
          image: prod.image,
          description: prod.description?.slice(0, 100) + "..." || "",
          reason: `Popular in ${prod.category}, your frequently viewed category`,
        }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);

      recommendations.wheeledSpecialProducts = wheeled;
    }

    // 2. Check wishlist for price drops or stock updates
    if (preferences.wishlistItems.length > 0) {
      const wishlistIds = preferences.wishlistItems.map((item) =>
        typeof item === "string" ? item : item._id
      );

      const wishlistProds = await Product.find({ _id: { $in: wishlistIds } }).lean();

      const withPriceChanges = wishlistProds
        .map((prod) => ({
          id: prod._id,
          name: prod.name,
          price: prod.price,
          originalPrice: prod.originalPrice,
          discount: prod.discount || 0,
          category: prod.category,
          stock: prod.quantity || prod.stock,
          image: prod.image,
          inStock: prod.inStock,
          description: prod.description?.slice(0, 100) + "..." || "",
          reason: "In your wishlist",
        }))
        .filter((prod) => prod.inStock) // Only in-stock items
        .slice(0, 5);

      recommendations.wishlishPriceDrops = withPriceChanges;
    }

    // 3. Find new arrivals in favorite categories
    if (preferences.topCategories.length > 0) {
      const topCategoryNames = preferences.topCategories.map((c) => c.category);
      const onWeekAgo = new Date();
      onWeekAgo.setDate(onWeekAgo.getDate() - 7);

      const newArrivals = await Product.find({
        category: { $in: topCategoryNames },
        inStock: true,
        createdAt: { $gte: onWeekAgo }, // Products added in last 7 days
      })
        .limit(5)
        .lean();

      const formatted = newArrivals.map((prod) => ({
        id: prod._id,
        name: prod.name,
        price: prod.price,
        originalPrice: prod.originalPrice,
        discount: prod.discount || 0,
        category: prod.category,
        stock: prod.quantity || prod.stock,
        image: prod.image,
        description: prod.description?.slice(0, 100) + "..." || "",
        reason: "🆕 New in your favorite category",
      }));

      recommendations.newStockArrivals = formatted;
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return null;
  }
};

/**
 * Batch generate recommendations for all customers who have watch history or wishlist
 * @returns {array} - Details of recommendations generated
 */
const generateRecommendationsForAllCustomers = async () => {
  try {
    const customers = await User.find({
      role: "customer",
      $or: [
        { watchHistory: { $exists: true, $ne: [] } },
        { wishlist: { $exists: true, $ne: [] } }
      ]
    }).select("email name");

    const results = [];

    for (const customer of customers) {
      const recs = await generatePersonalizedRecommendations(customer.email);
      if (recs) {
        results.push({
          email: customer.email,
          customerName: customer.name,
          recommendationCount:
            recs.wheeledSpecialProducts.length +
            recs.wishlishPriceDrops.length +
            recs.newStockArrivals.length,
          topCategory: recs.topCategoryPreferences[0]?.category || "N/A",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error batch generating recommendations:", error);
    return [];
  }
};

module.exports = {
  analyzeCustomerPreferences,
  generatePersonalizedRecommendations,
  generateRecommendationsForAllCustomers,
};
