import { products as fallbackProducts } from "../data/products";

const API_BASE_URL = "http://localhost:5000/api/products";

// Default placeholder images for different categories
const placeholderImages = {
  bowls: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=300&h=300&fit=crop",
  plates: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop",
  glasses: "https://images.unsplash.com/photo-1608270861620-7191c1a877e6?w=300&h=300&fit=crop",
  spoons: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop",
  cutlery: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop",
  default: "https://via.placeholder.com/300x300?text=Product+Image"
};

export const normalizeProduct = (product, index = 0) => {
  const imageList = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];
  
  // Get primary image
  let primaryImage = imageList[0] || product.image || "";
  
  // If no image, use category-based placeholder
  if (!primaryImage) {
    const category = (product.category || "misc").toLowerCase();
    primaryImage = placeholderImages[category] || placeholderImages.default;
  }
  
  const numericPrice = Number(product.price) || 0;
  const discountPercent = Number(product.discountPercent) || 0;
  const productId = product._id || product.id || String(index + 1);

  return {
    ...product,
    id: String(productId),
    image: primaryImage,
    images: imageList.length ? imageList : [primaryImage],
    category: (product.category || "misc").toLowerCase(),
    price: numericPrice,
    discountPercent,
    discount: discountPercent ? `${discountPercent}% off` : product.discount || "",
    bought: product.bought || product.orders || "0 bought",
    delivery: product.delivery || "FREE delivery",
    reviews: Number(product.reviews) || 0,
    rating: Number(product.rating) || 4.5,
    sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["Standard"],
  };
};

export const getFallbackProducts = () => {
  // Return local data when API fails - better UX than blank products list
  console.log("📌 [PRODUCTS] Using fallback - showing locally cached products");
  return fallbackProducts.map((product, index) => normalizeProduct(product, index));
};

export const fetchProducts = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    // Only use products from database - STRICT VALIDATION
    const dbProducts = data.products || [];
    
    if (!Array.isArray(dbProducts)) {
      console.error("❌ [PRODUCTS] Invalid products format from API");
      return getFallbackProducts();
    }
    
    if (dbProducts.length === 0) {
      console.warn("⚠️ [PRODUCTS] Database is empty - using fallback");
      return getFallbackProducts();
    }

    const normalizedProducts = dbProducts.map((product, index) => normalizeProduct(product, index));
    console.log(`✅ [PRODUCTS] Loaded ${normalizedProducts.length} products from database`);
    
    return normalizedProducts;
  } catch (error) {
    console.warn("⚠️ [PRODUCTS] Failed to fetch from API:", error.message);
    console.log("📌 [PRODUCTS] Falling back to local data...");
    return getFallbackProducts();
  }
};
