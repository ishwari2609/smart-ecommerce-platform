import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { fetchProducts, getFallbackProducts, normalizeProduct } from "../utils/products";

function Category() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackedProducts, setTrackedProducts] = useState(new Set());

  // Track product view (debounced - only track once per product per session)
  const trackProductView = async (product) => {
    try {
      const email = localStorage.getItem("userEmail") || localStorage.getItem("email");
      
      if (!email || trackedProducts.has(product.id)) return; // Only track once
      
      const trackData = {
        email,
        productId: product.id,
        productName: product.name,
        category: product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
      };

      const res = await fetch("http://localhost:5000/api/products/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackData)
      });

      if (res.ok) {
        setTrackedProducts(prev => new Set([...prev, product.id]));
        console.log(`👁️ [TRACK] Tracked: ${product.name}`);
      } else {
        // Silently skip tracking on error - don't spam console
        console.debug(`⚠️ [TRACK] Tracking skipped for: ${product.name}`);
      }
    } catch (err) {
      // Silently skip tracking on error - don't spam console with warnings
      console.debug(`[TRACK] Tracking unavailable for: ${product.name}`);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const loadedProducts = await fetchProducts();
        
        if (!loadedProducts || loadedProducts.length === 0) {
          console.warn("⚠️ [PRODUCTS] No products available");
          setAllProducts([]);
          return;
        }
        
        console.log(`✅ [PRODUCTS] Loaded ${loadedProducts.length} products`);
        setAllProducts(loadedProducts);
      } catch (error) {
        console.error("❌ [PRODUCTS] Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [name]);
  
  const filteredProducts =
    name === "all"
      ? allProducts
      : allProducts.filter(
          (product) => product.category.toLowerCase() === name.toLowerCase()
        );

  // Auto-track visible products once (no spam)
  useEffect(() => {
    if (filteredProducts.length === 0 || !localStorage.getItem("userEmail")) return;
    
    console.debug(`[TRACKING] Tracking ${filteredProducts.length} product(s)`);
    
    filteredProducts.forEach((product) => {
      trackProductView(product);
    });
  }, [filteredProducts]);

  // ✅ HANDLE ADD TO CART WITH LOGIN CHECK
  const handleAdd = (product) => {
    const token = localStorage.getItem("token");

    if (!token) {
      // redirect to login
      navigate("/login");
      return;
    }

    addToCart(product);
  };

  return (
    <>
      <Navbar />

      <div style={{ padding: "30px", background: "#f9f9f9", minHeight: "80vh" }}>
        <h2 style={{ marginBottom: "20px", color: "#131921" }}>
          {name === "all" ? "🛒 All Products" : `${name.toUpperCase()}`}
        </h2>

        {loading && <p style={{ textAlign: "center", marginTop: "40px" }}>⏳ Loading products...</p>}

        {/* EMPTY STATE */}
        {!loading && allProducts.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            background: "white", 
            borderRadius: "12px",
            border: "2px dashed #ddd"
          }}>
            <p style={{ fontSize: "18px", color: "#999", marginBottom: "10px" }}>
              📦 No products available yet
            </p>
            <p style={{ fontSize: "14px", color: "#bbb" }}>
              Admin will add products soon
            </p>
          </div>
        )}

        {/* EMPTY CATEGORY FILTER */}
        {!loading && allProducts.length > 0 && filteredProducts.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            background: "white", 
            borderRadius: "12px",
            border: "2px dashed #ddd"
          }}>
            <p style={{ fontSize: "18px", color: "#999", marginBottom: "10px" }}>
              🔍 No products in {name} category
            </p>
            <p style={{ fontSize: "14px", color: "#bbb", marginBottom: "15px" }}>
              But we have {allProducts.length} products in other categories
            </p>
            <button 
              onClick={() => navigate("/category/all")}
              style={{
                padding: "10px 20px",
                background: "#f0c14b",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              View All Products
            </button>
          </div>
        )}

        {/* PRODUCTS LIST */}
        {!loading && filteredProducts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
            {filteredProducts.map((product) => {
            const productImage = product.image || product.images?.[0] || "https://via.placeholder.com/180?text=No+Image";
            
            return (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  gap: "20px",
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  borderLeft: "4px solid #f0c14b"
                }}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* IMAGE */}
                <div style={{
                  flexShrink: 0,
                  width: "180px",
                  height: "180px",
                  overflow: "hidden",
                  borderRadius: "10px",
                  background: "#f3f3f3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <img
                    src={productImage}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/180?text=Product+Image";
                    }}
                  />
                </div>

                {/* DETAILS */}
                <div style={{ flex: 1 }}>
                  {/* TITLE */}
                  <h3 style={{ margin: "0 0 8px 0", color: "#131921", fontSize: "20px" }}>
                    {product.name}
                  </h3>

                  {/* CATEGORY */}
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#999" }}>
                    🏷️ {product.category || "Misc"}
                  </p>

                  {/* DESCRIPTION */}
                  {product.description && (
                    <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#555", lineHeight: "1.4" }}>
                      {product.description.substring(0, 100)}...
                    </p>
                  )}

                  {/* ⭐ RATING */}
                  <div style={{ color: "#f59e0b", fontSize: "14px", marginBottom: "8px" }}>
                    ⭐ {product.rating || "4.3"} ({product.reviews || "120"} reviews)
                  </div>

                  {/* 📦 ORDERS */}
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 10px 0" }}>
                    📦 {product.bought || "1K+ bought in past month"}
                  </p>

                  {/* 💰 PRICE */}
                  <div style={{ marginTop: "10px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#131921" }}>
                      ₹{product.discountPercent ? (product.price * (1 - product.discountPercent / 100)).toFixed(0) : product.price}
                    </span>

                    {product.discount && (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#6b7280",
                            fontSize: "16px",
                          }}
                        >
                          ₹{product.price}
                        </span>

                        <span
                          style={{
                            background: "#16a34a",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "600"
                          }}
                        >
                          {product.discountPercent || "30"}% off
                        </span>
                      </>
                    )}
                  </div>

                  {/* 🚚 DELIVERY */}
                  <p style={{ color: "green", marginBottom: "10px", fontSize: "14px", fontWeight: "500" }}>
                    ✅ {product.delivery || "FREE delivery by Tomorrow"}
                  </p>

                  {/* 🔒 TRUST TEXT */}
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" }}>
                    ✓ Secure transaction | ✓ Easy returns | ✓ Cash on Delivery
                  </p>

                  {/* STOCK STATUS */}
                  <div style={{ padding: "8px", borderRadius: "6px", marginBottom: "12px", background: product.inStock !== false ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${product.inStock !== false ? "#10b981" : "#ef4444"}` }}>
                    {product.inStock !== false ? (
                      <p style={{ margin: 0, color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✅ In Stock ({product.quantity || 100} available)</p>
                    ) : (
                      <p style={{ margin: 0, color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>❌ Out of Stock</p>
                    )}
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAdd(product);
                    }}
                    disabled={product.inStock === false}
                    style={{
                      padding: "12px 32px",
                      background: product.inStock === false ? "#cccccc" : "linear-gradient(45deg, #ffd814, #ffcc00)",
                      border: "none",
                      borderRadius: "24px",
                      cursor: product.inStock === false ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "15px",
                      color: product.inStock === false ? "#666" : "#000",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      opacity: product.inStock === false ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (product.inStock !== false) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.inStock !== false) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                      }
                    }}
                  >
                    {product.inStock === false ? "❌ Out of Stock" : "🛒 Add to Cart"}
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

export default Category;
