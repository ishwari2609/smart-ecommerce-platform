import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import "./Wishlist.css";

function Wishlist() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      // Try to load from backend first
      if (email) {
        const response = await fetch(
          `http://localhost:5000/api/products/wishlist/get?email=${encodeURIComponent(email)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data.wishlistItems || []);
          // Sync with localStorage
          localStorage.setItem("wishlist", JSON.stringify(data.wishlistItems || []));
        } else {
          // Fallback to localStorage
          const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
          setWishlistItems(saved);
        }
      } else {
        // Fallback to localStorage if no email
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlistItems(saved);
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
      // Fallback to localStorage
      const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistItems(saved);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      // Call backend API
      if (email) {
        const response = await fetch("http://localhost:5000/api/products/wishlist/remove", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            productId: productId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove from wishlist");
        }
      }

      // Update local state
      const updated = wishlistItems.filter(item => String(item._id || item.id) !== String(productId));
      setWishlistItems(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      alert("❌ Failed to remove from wishlist");
    }
  };

  const handleAddToCart = (product) => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (product.inStock === false) {
      alert("❌ This product is out of stock");
      return;
    }

    addToCart(product);
    alert(`✅ ${product.name} added to cart!`);
  };

  const handleMoveToCart = (product) => {
    handleAddToCart(product);
    removeFromWishlist(product._id || product.id);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="wishlist-container">
          <p style={{ textAlign: "center", marginTop: "40px" }}>⏳ Loading wishlist...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>❤️ My Wishlist</h1>
          <p>{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <p style={{ fontSize: "48px" }}>🛍️</p>
            <h2>Your wishlist is empty</h2>
            <p>Save items you like and they'll appear here</p>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate("/category/all")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((product) => {
              const productId = product._id || product.id;
              return (
              <div key={productId} className="wishlist-card">
                {/* PRODUCT IMAGE */}
                <div className="wishlist-image">
                  <img 
                    src={product.images?.[0] || product.image || "https://via.placeholder.com/200?text=Product"} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                  <span className="stock-badge">
                    {product.inStock !== false ? "✅ In Stock" : "❌ Out"}
                  </span>
                </div>

                {/* PRODUCT INFO */}
                <div className="wishlist-info">
                  <h3>{product.name}</h3>
                  <p className="category">🏷️ {product.category}</p>
                  
                  {/* PRICE */}
                  <div className="price-section">
                    <span className="price">₹{(product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(0)}</span>
                    {product.discountPercent ? (
                      <>
                        <span className="original-price">₹{product.price}</span>
                        <span className="discount">{product.discountPercent}% OFF</span>
                      </>
                    ) : null}
                  </div>

                  {/* RATING */}
                  <p className="rating">
                    ⭐ {product.rating || 4.5} ({product.reviews || 120} reviews)
                  </p>

                  {/* BUTTONS */}
                  <div className="wishlist-actions">
                    <button 
                      className="add-cart-btn"
                      onClick={() => handleMoveToCart(product)}
                      disabled={product.inStock === false}
                    >
                      🛒 Add to Cart
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromWishlist(productId)}
                      title="Remove from wishlist"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* VIEW DETAILS */}
                  <button
                    className="view-details-btn"
                    onClick={() => navigate(`/product/${productId}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Wishlist;
