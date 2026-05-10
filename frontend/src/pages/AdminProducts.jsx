import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import { products as initialProducts } from "../data/products";
import Toast from "../components/Toast";

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    cost: "",
    discountPercent: "",
    images: [],
    imageUrl: "",
    inStock: true,
    quantity: "100",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    description: "",
  });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [watchAnalytics, setWatchAnalytics] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(true);

  const fetchProducts = async () => {
    try {
      // Guard: Only fetch if authenticated as admin
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      if (!token || role !== "admin") {
        setProducts([]);
        return;
      }

      const res = await fetch("http://localhost:5000/api/products", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      const enhanced = initialProducts.map((p, index) => ({
        ...p,
        id: index + 1,
        discountPercent: p.discount ? parseFloat(p.discount.replace("% off", "")) : 0,
        cost: p.price * 0.6,
      }));
      setProducts(enhanced);
    }
  };

  const fetchCategories = async () => {
    const defaultCategories = [
      { _id: "1", name: "Bowls", icon: "🥣", description: "Ceramic and steel bowls" },
      { _id: "2", name: "Plates", icon: "🍽️", description: "Dining plates" },
      { _id: "3", name: "Glasses", icon: "🥤", description: "Drinking glasses" },
      { _id: "4", name: "Cutlery", icon: "🍴", description: "Spoons, forks, knives" },
      { _id: "5", name: "Sets", icon: "📦", description: "Combo kitchen sets" },
    ];

    try {
      const res = await fetch("http://localhost:5000/api/products/categories");
      const data = await res.json();
      if (res.ok && data.categories && data.categories.length > 0) {
        console.log("✅ Categories loaded:", data.categories);
        setCategories(data.categories);
      } else {
        console.warn("No categories from API, using defaults");
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.warn("Failed to fetch categories, using defaults:", err);
      setCategories(defaultCategories);
    }
  };

  useEffect(() => {
    // Verify admin access - STRICT CHECK
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    
    // If not authenticated as admin, stop here - don't load anything
    if (role !== "admin" || !token) {
      setWatchAnalytics([]);
      return; // Early exit - don't set up intervals
    }

    // Only proceed if we have both role and token
    fetchProducts();
    fetchCategories();
    loadWatchAnalytics();

    // Auto-refresh analytics every 5 seconds (only when authenticated and LIVE mode ON)
    const analyticsInterval = setInterval(() => {
      // Double-check auth before each refresh
      const currentToken = localStorage.getItem("token");
      const currentRole = localStorage.getItem("role");

      if (currentToken && currentRole === "admin" && isLiveMode) {
        loadWatchAnalytics(); // Silent refresh - no logging
      }
    }, 5000);

    return () => {
      clearInterval(analyticsInterval);
    };
  }, [isLiveMode]);

  const loadWatchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // Skip silently if not authenticated - this is expected during login
      if (!token || role !== "admin") {
        setWatchAnalytics([]);
        return;
      }

      // Validate token format
      if (!token.includes(".")) {
        console.error("❌ Invalid token format");
        setWatchAnalytics([]);
        return;
      }

      const res = await fetch("http://localhost:5000/api/products/watch-analytics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          console.error("❌ Authentication failed - token may be invalid or expired");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        } else if (res.status === 403) {
          console.error("❌ Authorization failed - user is not admin");
        } else {
          console.error("❌ Analytics error:", data.message || `Server error (${res.status})`);
        }
        setWatchAnalytics([]);
        return;
      }

      const data = await res.json();
      console.debug(`📊 [LIVE ANALYTICS] Updated: ${data.products?.length} tracked products, ${data.totalViews} total views`);
      setWatchAnalytics(data.products || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("❌ Analytics fetch error:", err.message);
      setWatchAnalytics([]);
    }
  };

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct((prev) => ({
        ...prev,
        images: typeof reader.result === "string" ? [reader.result] : [],
        imageUrl: "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const parsedPrice = parseFloat(newProduct.price);
    const parsedCost = parseFloat(newProduct.cost);
    const parsedDiscount = parseFloat(newProduct.discountPercent) || 0;

    if (!newProduct.name || isNaN(parsedPrice) || isNaN(parsedCost)) {
      setType("error");
      setMessage("Please provide name, price, and cost correctly");
      return;
    }

    const finalImages = [];
    if (newProduct.imageUrl) finalImages.push(newProduct.imageUrl);
    if (newProduct.images.length) finalImages.push(...newProduct.images);

    const payload = {
      ...newProduct,
      price: parsedPrice,
      cost: parsedCost,
      discountPercent: parsedDiscount,
      images: finalImages,
      ...(editingId && { id: editingId }),
    };

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `http://localhost:5000/api/products/${editingId}`
        : "http://localhost:5000/api/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Auto-refresh products list
      await fetchProducts();

      if (editingId) {
        setType("success");
        setMessage("✏️ Product updated successfully");
        setEditingId(null);
      } else {
        setType("success");
        setMessage("✅ Product added successfully");
      }

      setNewProduct({
        name: "",
        category: "",
        description: "",
        price: "",
        cost: "",
        discountPercent: "",
        images: [],
        imageUrl: "",
        inStock: true,
        quantity: "100",
      });

      setImageFile(null);
      window.scrollTo({ top: 500, behavior: "smooth" });
    } catch (error) {
      setType("error");
      setMessage("❌ " + (error.message || "Failed to save product"));
    }
  };

  const handleNotify = async (product) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/products/notify-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id || product.id,
          productName: product.name,
          category: product.category,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setType("success");
        setMessage(`📧 ${data.message || `Notified ${data.notifiedCount || 'customers'}`}`);
      } else {
        setType("error");
        setMessage("❌ " + (data.message || "Failed to send notification"));
      }
    } catch (err) {
      setType("error");
      setMessage("❌ Notification server error");
      console.error("Notify error:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    setNewProduct({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      cost: product.cost.toString(),
      discountPercent: product.discountPercent.toString(),
      images: product.images || [],
      imageUrl: "",
      inStock: product.inStock !== undefined ? product.inStock : true,
      quantity: (product.quantity || 100).toString(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId) => {
    if (!confirm("🗑️ Delete this product permanently?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-refresh products list
        await fetchProducts();
        setType("success");
        setMessage("🗑️ Product deleted successfully");
      } else {
        setType("error");
        setMessage("❌ " + (data.message || "Failed to delete product"));
      }
    } catch {
      setType("error");
      setMessage("❌ Server error while deleting product");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewProduct({
      name: "",
      category: "",
      description: "",
      price: "",
      cost: "",
      discountPercent: "",
      images: [],
      imageUrl: "",
      inStock: true,
      quantity: "100",
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name.trim()) {
      setType("error");
      setMessage("Category name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/products/category/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          icon: newCategory.icon || "📦",
          description: newCategory.description,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories([...categories, data.category]);
        setNewCategory({ name: "", icon: "", description: "" });
        setType("success");
        setMessage("🏷️ Category added successfully");
      } else {
        setType("error");
        setMessage("❌ " + (data.message || "Failed to add category"));
      }
    } catch (error) {
      setType("error");
      setMessage("❌ Server error while adding category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("🗑️ Delete this category permanently?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/products/category/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setCategories(categories.filter(c => c._id !== categoryId));
        setType("success");
        setMessage("🗑️ Category deleted successfully");
      } else {
        setType("error");
        setMessage("❌ Failed to delete category");
      }
    } catch {
      setType("error");
      setMessage("❌ Server error while deleting category");
    }
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategoryId(category._id);
    setNewCategory({
      name: category.name,
      icon: category.icon,
      description: category.description,
    });
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name.trim()) {
      setType("error");
      setMessage("Category name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/products/category/${editingCategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          icon: newCategory.icon || "📦",
          description: newCategory.description,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories(categories.map(c => c._id === editingCategoryId ? data.category : c));
        setNewCategory({ name: "", icon: "", description: "" });
        setEditingCategoryId(null);
        setType("success");
        setMessage("✏️ Category updated successfully");
      } else {
        setType("error");
        setMessage("❌ " + (data.message || "Failed to update category"));
      }
    } catch (error) {
      setType("error");
      setMessage("❌ Server error while updating category");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setNewCategory({ name: "", icon: "", description: "" });
  };

  const handleNotifyByHistory = async (product) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/products/notify-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id || product.id,
          productName: product.name,
          category: product.category,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setType("success");
        setMessage(`✅ ${data.message} (${data.notifiedCount} customers)`);
      } else {
        setType("error");
        setMessage(data.message || "Failed to send notification");
      }
    } catch {
      setType("error");
      setMessage("Notification server error");
    }
  };

  const totalProfit = products.reduce((sum, p) => {
    const sale = p.price * (1 - (p.discountPercent || 0) / 100);
    return sum + Math.max(0, sale - (p.cost || 0));
  }, 0);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Product Manager</h1>
        <button className="logout-btn" onClick={() => navigate("/admin")}>
          Back to Dashboard
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      <Toast
        message={message}
        type={type}
        onClose={() => setMessage("")}
      />

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", width: "100%", maxWidth: "1200px", justifyContent: "center" }}>
        <button
          onClick={() => setActiveTab("products")}
          style={{
            padding: "10px 30px",
            background: activeTab === "products" ? "#f0c14b" : "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "8px",
            color: activeTab === "products" ? "black" : "white",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
        >
          📦 Products
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          style={{
            padding: "10px 30px",
            background: activeTab === "categories" ? "#f0c14b" : "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "8px",
            color: activeTab === "categories" ? "black" : "white",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
        >
          🏷️ Categories
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <>
      {/* 🔥 FULL WIDTH FORM */}
      <div className="admin-card full-width">
        <h3>{editingId ? "✏️ Edit Product" : "➕ Add New Product"}</h3>

        <form onSubmit={handleAddProduct} style={{ display: "grid", gap: "10px" }}>
          <input name="name" value={newProduct.name} onChange={handleChange} placeholder="Name" required />
          <select name="category" value={newProduct.category} onChange={handleChange} required style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#2d3748", color: "#fff", border: "2px solid #667eea", fontFamily: "'Poppins', sans-serif", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
            <option value="" style={{ background: "#2d3748", color: "#fff" }}>Select Category ({categories.length} available)</option>
            {categories && categories.length > 0 ? (
              categories.map(cat => (
                <option key={cat._id || cat.name} value={cat.name} style={{ background: "#2d3748", color: "#fff" }}>
                  {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                </option>
              ))
            ) : (
              <option disabled style={{ background: "#2d3748", color: "#999" }}>No categories available</option>
            )}
          </select>
          <input name="description" value={newProduct.description} onChange={handleChange} placeholder="Description" />
          <input name="price" type="number" value={newProduct.price} onChange={handleChange} placeholder="Price (₹)" required />
          <input name="cost" type="number" value={newProduct.cost} onChange={handleChange} placeholder="Cost Price (₹)" required />
          <input name="discountPercent" type="number" value={newProduct.discountPercent} onChange={handleChange} placeholder="Discount %" />
          <input name="imageUrl" value={newProduct.imageUrl} onChange={handleChange} placeholder="Image URL" />
          <input name="quantity" type="number" value={newProduct.quantity} onChange={handleChange} placeholder="Stock Quantity" required />
          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={newProduct.inStock} 
              onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
            <span>{newProduct.inStock ? "✅ In Stock" : "❌ Out of Stock"}</span>
          </label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button className="login-button" type="submit">{editingId ? "Update Product" : "Add Product"}</button>
            {editingId && (
              <button 
                className="login-button" 
                type="button" 
                onClick={handleCancel}
                style={{ background: "linear-gradient(45deg, #ef4444, #dc2626)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🔥 4 CARDS HORIZONTAL */}
      <div className="top-cards">
        <div className="admin-card">
          <h3>Total Items</h3>
          <p>{products.length}</p>
        </div>

        <div className="admin-card">
          <h3>Potential Profit</h3>
          <p>₹{totalProfit.toFixed(2)}</p>
        </div>

        <div className="admin-card">
          <h3>Analytics</h3>
          <p>{watchAnalytics.length} tracked</p>
        </div>

        <div className="admin-card">
          <h3>Status</h3>
          <p>Active</p>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="admin-card">
        <h3>📦 Products in Inventory</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Image</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Price</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Discount</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Sale Price</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Stock</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Profit</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length > 0 ? (
                products.map((p) => {
                  const sale = p.price * (1 - (p.discountPercent || 0) / 100);
                  const profit = sale - (p.cost || 0);
                  const productImage = Array.isArray(p.images) && p.images.length ? p.images[0] : p.image;

                  return (
                    <tr key={p._id || p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: "12px" }}>
                        {productImage && (
                          <img 
                            src={productImage} 
                            alt={p.name} 
                            style={{ width: "50px", height: "50px", borderRadius: "5px", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/50?text=No+Image";
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>{p.name}</td>
                      <td style={{ padding: "12px" }}>{p.category}</td>
                      <td style={{ padding: "12px" }}>₹{p.price}</td>
                      <td style={{ padding: "12px" }}>{p.discountPercent || 0}%</td>
                      <td style={{ padding: "12px" }}>₹{sale.toFixed(2)}</td>
                      <td style={{ padding: "12px" }}>
                        {p.inStock !== false ? (
                          <span style={{ color: "#10b981", fontWeight: "600" }}>✅ In ({p.quantity || 100})</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: "600" }}>❌ Out</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>₹{profit.toFixed(2)}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{
                            padding: "6px 12px",
                            marginRight: "5px",
                            background: "linear-gradient(45deg, #3b82f6, #2563eb)",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id || p.id)}
                          style={{
                            padding: "6px 12px",
                            background: "linear-gradient(45deg, #ef4444, #dc2626)",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ANALYTICS */}
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>
            <span style={{ marginRight: "8px" }}>📊 Customer Watch Analytics</span>
            {isLiveMode && (
              <span style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                background: "#10b981",
                borderRadius: "50%",
                animation: "pulse 1s infinite"
              }} title="LIVE - Auto-updating every 2 seconds">
              </span>
            )}
          </h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {lastUpdate && (
              <span style={{ fontSize: "12px", color: "#999" }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={() => setIsLiveMode(!isLiveMode)}
              style={{
                padding: "6px 12px",
                background: isLiveMode ? "#10b981" : "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              {isLiveMode ? "🔴 LIVE ON" : "⚪ LIVE OFF"}
            </button>
            <button 
              onClick={loadWatchAnalytics} 
              style={{ 
                padding: "6px 12px", 
                background: "#667eea", 
                color: "white", 
                border: "none", 
                borderRadius: "5px", 
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {watchAnalytics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#999" }}>
            <p>📊 No watch history data available yet</p>
            <p style={{ fontSize: "12px", marginTop: "10px" }}>Customers need to view products first</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(240,193,75,0.3)", background: "rgba(0,0,0,0.2)" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#f0c14b", fontWeight: "600" }}>Product</th>
                <th style={{ padding: "12px", textAlign: "center", color: "#f0c14b", fontWeight: "600" }}>Total Views</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#f0c14b", fontWeight: "600" }}>Customers</th>
              </tr>
            </thead>

            <tbody>
              {watchAnalytics.map((item) => (
                <tr key={item.productId} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ padding: "12px" }}>
                    <strong>{item.productName || "-"}</strong>
                    <br/>
                    <span style={{ fontSize: "12px", color: "#999" }}>Category: {item.category || "N/A"}</span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{ background: "#667eea", color: "white", padding: "4px 12px", borderRadius: "20px", fontWeight: "bold" }}>
                      {item.totalViews}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#d1d5db" }}>
                    {item.customerViews && item.customerViews.length > 0 ? (
                      <div>
                        {item.customerViews.map((c, idx) => (
                          <div key={idx} style={{ marginBottom: "4px" }}>
                            📧 {c.email} - <span style={{ color: "#f0c14b" }}>{c.views} views</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#999" }}>No customer data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
        `}</style>
      </div>
        </>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <>
      {/* ADD/EDIT CATEGORY FORM */}
      <div className="admin-card full-width">
        <h3>{editingCategoryId ? "✏️ Edit Category" : "➕ Add New Category"}</h3>

        <form onSubmit={editingCategoryId ? handleUpdateCategory : handleAddCategory} style={{ display: "grid", gap: "10px" }}>
          <input 
            value={newCategory.name} 
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} 
            placeholder="Category Name (e.g., Bowls, Plates)" 
            required 
          />
          <input 
            value={newCategory.icon} 
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })} 
            placeholder="Icon (e.g., 🍽️, 🥘, 📦)" 
          />
          <input 
            value={newCategory.description} 
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} 
            placeholder="Description (optional)" 
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="login-button" type="submit" style={{ flex: 1 }}>
              {editingCategoryId ? "💾 Update Category" : "Add Category"}
            </button>
            {editingCategoryId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                style={{ 
                  flex: 1,
                  padding: "10px 20px",
                  background: "#6b7280", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "5px", 
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CATEGORIES LIST */}
      <div className="admin-card">
        <h3>📋 Manage Categories</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Icon</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ padding: "12px" }}>{cat.icon}</td>
                  <td style={{ padding: "12px" }}>{cat.name}</td>
                  <td style={{ padding: "12px" }}>{cat.description}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEditCategoryClick(cat)}
                      style={{
                        padding: "6px 12px",
                        marginRight: "5px",
                        background: "linear-gradient(45deg, #3b82f6, #2563eb)",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      style={{
                        padding: "6px 12px",
                        background: "linear-gradient(45deg, #ef4444, #dc2626)",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No categories found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}

export default AdminProducts;
