import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ImageGallery from "../components/ImageGallery";
import ProductCard from "../components/ProductCard";
import { fetchProducts, getFallbackProducts } from "../utils/products";
import { useCart } from "../context/CartContext";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "customer";
  const [products, setProducts] = useState(getFallbackProducts());
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const loadedProducts = await fetchProducts();
        setProducts(loadedProducts);
        localStorage.setItem("smartProducts", JSON.stringify(loadedProducts));
      } catch (error) {
        const localProducts = JSON.parse(localStorage.getItem("smartProducts") || "null");
        if (Array.isArray(localProducts) && localProducts.length) {
          setProducts(localProducts);
        } else {
          setProducts(getFallbackProducts());
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const product = products.find((item) => String(item.id) === String(id));

  // Check if product is wishlisted
  useEffect(() => {
    if (product) {
      const isInWishlist = wishlist.some(w => String(w.id) === String(product.id));
      setIsWishlisted(isInWishlist);
    }
  }, [product, wishlist]);

  const similarProducts = product
    ? products.filter(
        (item) => item.category === product.category && item.id !== product.id
      ).slice(0, 4)
    : [];

  // Track product watch - fires once per product view
  useEffect(() => {
    if (!product) return;

    const email = localStorage.getItem("userEmail") || localStorage.getItem("email");
    
    if (!email) {
      console.warn("⚠️ Cannot track: No email found in localStorage");
      return;
    }

    const trackProduct = async () => {
      try {
        const categoryName = product.category 
          ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
          : "General";

        const trackData = { 
          email: email.toLowerCase().trim(), 
          productId: String(product.id), 
          productName: product.name || "Unknown Product",
          category: categoryName
        };
        
        console.log("📊 [WATCH] Sending track data:", trackData);
        
        const response = await fetch("http://localhost:5000/api/products/watch", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify(trackData),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log("✅ [WATCH] SUCCESS! View count:", result.watchCount, "Total watched items:", result.totalWatchedItems);
        } else {
          console.error("❌ [WATCH] FAILED:", result.message);
        }
      } catch (err) {
        console.error("❌ [WATCH] ERROR:", err.message);
      }
    };

    // Track immediately when product is loaded
    trackProduct();

  }, [product?.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="product-details-container">
          <p style={{ textAlign: "center", marginTop: "40px" }}>⏳ Loading product...</p>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="product-details-container">
          <p style={{ textAlign: "center", marginTop: "40px" }}>😔 Product not found.</p>
          <button 
            onClick={() => navigate("/category/all")}
            className="back-btn"
          >
            ← Back to Products
          </button>
        </div>
      </>
    );
  }

  const priceWithDiscount = product.discountPercent
    ? (product.price * (1 - product.discountPercent / 100)).toFixed(2)
    : product.price;

  const totalPrice = (priceWithDiscount * quantity).toFixed(2);

  const handleWishlist = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    let updatedWishlist;
    const endpoint = isWishlisted ? "/wishlist/remove" : "/wishlist/add";
    
    try {
      // Make API call to backend
      const response = await fetch(`http://localhost:5000/api/products${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          productId: product.id
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update wishlist");
      }

      // Update local state
      if (isWishlisted) {
        updatedWishlist = wishlist.filter(w => String(w.id) !== String(product.id));
        setMsgType("info");
        setMessage("❌ Removed from wishlist");
      } else {
        updatedWishlist = [...wishlist, product];
        setMsgType("success");
        setMessage("❤️ Added to wishlist");
      }
      
      setWishlist(updatedWishlist);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    } catch (err) {
      console.error("Error updating wishlist:", err);
      setMsgType("error");
      setMessage("❌ Failed to update wishlist");
    }
    
    setTimeout(() => setMessage(""), 2000);
  };

  const handleShare = () => {
    const productUrl = window.location.href;
    const text = `Check out ${product.name} - ₹${priceWithDiscount} on Smart Ecommerce Platform!`;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: text,
        url: productUrl
      }).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(productUrl);
      setMsgType("success");
      setMessage("📋 Product link copied to clipboard!");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleAddToCart = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!product.inStock) {
      setMsgType("error");
      setMessage("❌ Product is out of stock");
      return;
    }

    if (!selectedSize) {
      setMsgType("error");
      setMessage("Please select a size");
      return;
    }

    addToCart({ ...product, selectedSize, quantity });
    setMsgType("success");
    setMessage(`✅ Added ${quantity} item(s) to cart!`);
    setTimeout(() => setMessage(""), 2000);
  };

  const handleBuyNow = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!product.inStock) {
      setMsgType("error");
      setMessage("❌ Product is out of stock");
      return;
    }

    if (!selectedSize) {
      setMsgType("error");
      setMessage("Please select a size");
      return;
    }

    // Add to cart and navigate to checkout
    addToCart({ ...product, selectedSize, quantity });
    navigate("/checkout");
  };

  return (
    <>
      <Navbar />
      <div className="product-details-container">
        
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="product-details-wrapper">
          {/* LEFT SIDE - IMAGES */}
          <div className="product-images-section">
            <ImageGallery images={product.images || []} />
          </div>

          {/* RIGHT SIDE - INFO */}
          <div className="product-info-section">
            {/* Product Title with Wishlist Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h1 className="product-title">{product.name}</h1>
              <button
                onClick={handleWishlist}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "32px",
                  cursor: "pointer",
                  padding: "0",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                {isWishlisted ? "❤️" : "🤍"}
              </button>
            </div>

            {/* Category */}
            <p className="product-category">🏷️ Category: <strong>{product.category}</strong></p>

            {/* Rating */}
            <div className="product-rating">
              <span className="stars">⭐ {product.rating || 4.5}</span>
              <span className="reviews">({product.reviews || 150} reviews)</span>
              <span className="bought">📦 {product.bought || "500+ bought this month"}</span>
            </div>

            {/* Price Section */}
            <div className="price-section">
              <div className="price-main">
                <span className="current-price">₹{priceWithDiscount}</span>
                {product.discountPercent ? (
                  <>
                    <span className="original-price">₹{product.price}</span>
                    <span className="discount-badge">{product.discountPercent}% OFF</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Stock Status */}
            <div style={{ padding: "12px", borderRadius: "8px", background: product.inStock ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `2px solid ${product.inStock ? "#10b981" : "#ef4444"}`, marginBottom: "15px" }}>
              {product.inStock ? (
                <p style={{ color: "#10b981", fontWeight: "600", margin: 0 }}>✅ In Stock ({product.quantity || 100} available)</p>
              ) : (
                <p style={{ color: "#ef4444", fontWeight: "600", margin: 0 }}>❌ Out of Stock</p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="product-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Delivery Info */}
            <div className="delivery-info">
              <p>✅ {product.delivery || "FREE delivery by Tomorrow"}</p>
              <p>✓ Secure transaction | ✓ Easy returns | ✓ Cash on Delivery</p>
            </div>

            {/* Size Selection */}
            <div className="size-section">
              <label>Select Size:</label>
              <div className="size-buttons">
                {product.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <button className="size-btn active" onClick={() => setSelectedSize("Standard")}>
                    Standard
                  </button>
                )}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="quantity-section">
              <label>Quantity:</label>
              <div className="quantity-input">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                />
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
              </div>
              <div style={{ marginTop: "12px", padding: "12px", background: "rgba(240, 193, 75, 0.1)", borderRadius: "8px", border: "1px solid #f0c14b" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Unit Price: <strong>₹{priceWithDiscount}</strong></p>
                <p style={{ margin: "8px 0 0 0", fontSize: "18px", color: "#000", fontWeight: "bold" }}>Total Price: <strong style={{ color: "#f0c14b" }}>₹{totalPrice}</strong></p>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={`message ${msgType}`}>
                {message}
              </div>
            )}

            {/* Add to Cart Button */}
            <button 
              className="add-to-cart-btn" 
              onClick={handleAddToCart}
              disabled={!product.inStock}
              style={{ opacity: !product.inStock ? 0.5 : 1, cursor: !product.inStock ? "not-allowed" : "pointer" }}
            >
              {product.inStock ? "🛒 Add to Cart" : "❌ Out of Stock"}
            </button>

            {/* Buy Now Button */}
            <button 
              className="add-to-cart-btn" 
              onClick={handleBuyNow}
              disabled={!product.inStock}
              style={{ 
                opacity: !product.inStock ? 0.5 : 1, 
                cursor: !product.inStock ? "not-allowed" : "pointer",
                background: "#28a745",
                marginTop: "10px"
              }}
            >
              {product.inStock ? "💳 Buy Now" : "❌ Out of Stock"}
            </button>

            {/* Share Buttons */}
            <div className="share-section">
              <button 
                className="share-btn" 
                onClick={handleWishlist}
                style={{ background: isWishlisted ? "#ef4444" : "transparent", color: isWishlisted ? "white" : "#ef4444" }}
              >
                {isWishlisted ? "❤️ In Wishlist" : "🤍 Add to Wishlist"}
              </button>
              <button className="share-btn" onClick={handleShare}>
                📤 Share Product
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="similar-products-section">
            <h2>Related Products</h2>
            <div className="similar-products-grid">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProductDetails;
