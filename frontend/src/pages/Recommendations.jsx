import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Recommendations.css";
import Toast from "../components/Toast";

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Get from localStorage
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "customer") {
      navigate("/");
      return;
    }

    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/products/recommendations/my?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setToast({
        type: "success",
        message: "✨ Recommendations loaded successfully!",
      });
    } catch (err) {
      setError(err.message);
      setToast({
        type: "error",
        message: "❌ Failed to load recommendations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    // Get current cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if product already in cart
    const existingItem = existingCart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
      setToast({
        type: "success",
        message: `✅ ${product.name} quantity updated!`,
      });
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: 1,
      });
      setToast({
        type: "success",
        message: `✅ ${product.name} added to cart!`,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
  };

  const handleViewDetails = (productId) => {
    setToast({
      type: "info",
      message: "📄 Loading product details...",
    });
    setTimeout(() => navigate(`/product/${productId}`), 300);
  };

  const ProductCard = ({ product }) => (
    <div className="rec-product-card">
      <div className="rec-image-container">
        {product.image ? (
          <img src={product.image} alt={product.name} className="rec-product-image" />
        ) : (
          <div className="rec-image-placeholder">📷 No Image</div>
        )}
        {product.discount > 0 && (
          <div className="rec-discount-badge">{product.discount}% OFF</div>
        )}
      </div>

      <div className="rec-product-info">
        <h4 className="rec-product-name">{product.name}</h4>
        
        <p className="rec-description">{product.description}</p>

        <div className="rec-category-badge">{product.category}</div>

        <div className="rec-pricing">
          <span className="rec-price">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="rec-original-price">₹{product.originalPrice}</span>
          )}
        </div>

        <div className="rec-stock-info">
          <span
            className={`rec-stock ${product.stock > 5 ? "in-stock" : "low-stock"}`}
          >
            📦 {product.stock} in stock
          </span>
        </div>

        <div className="rec-reason">{product.reason}</div>

        <div className="rec-actions">
          <button
            className="rec-btn rec-btn-details"
            onClick={() => handleViewDetails(product.id)}
          >
            View Details
          </button>
          <button
            className="rec-btn rec-btn-cart"
            onClick={() => handleAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="recommendations-container">
        <div className="rec-loading">Loading your personalized recommendations...</div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className="recommendations-container">
        <div className="rec-error">
          <h2>No recommendations available yet</h2>
          <p>Start browsing products to get personalized recommendations!</p>
          <button className="rec-btn rec-btn-primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const totalRecommendations =
    (recommendations.wheeledSpecialProducts?.length || 0) +
    (recommendations.wishlishPriceDrops?.length || 0) +
    (recommendations.newStockArrivals?.length || 0);

  return (
    <div className="recommendations-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="rec-header">
        <h1>🎯 Your Personalized Recommendations</h1>
        <p className="rec-subtitle">
          Handpicked products based on your browsing history ({totalRecommendations} items)
        </p>
      </div>

      {/* Your Interests */}
      {recommendations.topCategoryPreferences && recommendations.topCategoryPreferences.length > 0 && (
        <div className="rec-interests-section">
          <h2>📊 Your Shopping Interests</h2>
          <div className="rec-interests-grid">
            {recommendations.topCategoryPreferences.map((category, idx) => (
              <div key={idx} className="rec-interest-card">
                <h3>{category.category}</h3>
                <p>{category.watchCount} views</p>
                <div className="rec-interest-bar">
                  <div
                    className="rec-interest-fill"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <span className="rec-interest-percent">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Products */}
      {recommendations.wheeledSpecialProducts && recommendations.wheeledSpecialProducts.length > 0 && (
        <div className="rec-section">
          <h2 className="rec-section-title">🎁 Special Recommendations Based on Your Interests</h2>
          <div className="rec-grid">
            {recommendations.wheeledSpecialProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Wishlist Items */}
      {recommendations.wishlishPriceDrops && recommendations.wishlishPriceDrops.length > 0 && (
        <div className="rec-section">
          <h2 className="rec-section-title">❤️ Wishlist Items Available</h2>
          <p className="rec-section-subtitle">Great news! Items in your wishlist are now in stock</p>
          <div className="rec-grid">
            {recommendations.wishlishPriceDrops.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {recommendations.newStockArrivals && recommendations.newStockArrivals.length > 0 && (
        <div className="rec-section">
          <h2 className="rec-section-title">🆕 New Arrivals in Your Favorite Categories</h2>
          <p className="rec-section-subtitle">Check out these fresh new items</p>
          <div className="rec-grid">
            {recommendations.newStockArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Continue Shopping */}
      <div className="rec-footer">
        <button 
          className="rec-btn rec-btn-large" 
          onClick={() => {
            setToast({
              type: "info",
              message: "🏠 Heading back to store...",
            });
            setTimeout(() => navigate("/"), 300);
          }}
        >
          ← Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default Recommendations;
