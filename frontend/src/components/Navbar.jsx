import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [categories, setCategories] = useState([]);

  // USER DATA
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("role") || "customer";

  // Debug logging
  useEffect(() => {
    if (token) {
      console.log(`🔐 [NAVBAR] Current session: ${userEmail} as ${userRole.toUpperCase()}`);
    }
  }, [token, userRole, userEmail]);

  // FETCH CATEGORIES
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.warn("Failed to fetch categories", err);
        // Use default categories if fetch fails
        setCategories([
          { _id: "1", name: "Bowls", icon: "🍗" },
          { _id: "2", name: "Plates", icon: "🍽️" },
          { _id: "3", name: "Glasses", icon: "🥃" },
          { _id: "4", name: "Spoons & Forks", icon: "🥄" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    console.log(`🔓 [LOGOUT] Clearing session for ${userEmail}`);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    console.log("✅ [LOGOUT] All localStorage items cleared");
    setShowMenu(false);
    setTimeout(() => {
      console.log("🔄 [REDIRECT] Sending to /login");
      navigate("/login");
    }, 300);
  };

  // SEARCH
  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/category/${search.toLowerCase()}`);
    }
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <div className="navbar">
        <div className="nav-container">

          {/* LOGO */}
          <div className="logo" onClick={() => navigate("/")}>
            SmartCart
          </div>

          {/* SEARCH */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for bowls, plates, glasses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          {/* RIGHT */}
          <div className="nav-right">

            <div className="nav-item" onClick={() => navigate("/")}>
              Home
            </div>

            {/* USER DROPDOWN */}
            {token ? (
              <div
                className="nav-user"
                onMouseEnter={() => setShowMenu(true)}
                onMouseLeave={() => setShowMenu(false)}
              >
                👤 {userRole === "admin" ? "👨‍💼 ADMIN" : userEmail} ▾

                {showMenu && (
                  <div className="dropdown">
                    {userRole === "admin" ? (
                      <>
                        <div onClick={() => { navigate("/admin"); setShowMenu(false); }}>
                          🎛️ Dashboard
                        </div>
                        <div onClick={() => { navigate("/admin/products"); setShowMenu(false); }}>
                          📦 Manage Products
                        </div>
                        <div onClick={() => { navigate("/admin/recommendations"); setShowMenu(false); }}>
                          🎯 Send Recommendations
                        </div>
                        <hr style={{ margin: "8px 0", borderColor: "#ccc" }} />
                      </>
                    ) : (
                      <>
                        <div onClick={() => { navigate("/profile"); setShowMenu(false); }}>
                          👤 My Profile
                        </div>
                        <div onClick={() => { navigate("/wishlist"); setShowMenu(false); }}>
                          ❤️ My Wishlist
                        </div>
                        <div onClick={() => { navigate("/recommendations"); setShowMenu(false); }}>
                          🎯 Recommendations
                        </div>
                        <div onClick={() => { navigate("/orders"); setShowMenu(false); }}>
                          📦 Your Orders
                        </div>
                        <div onClick={() => { navigate("/orders"); setShowMenu(false); }}>
                          🚚 Track Orders
                        </div>
                        <div onClick={() => { navigate("/cart"); setShowMenu(false); }}>
                          🛒 Your Cart
                        </div>
                        <hr style={{ margin: "8px 0", borderColor: "#ccc" }} />
                      </>
                    )}
                    <div onClick={handleLogout}>
                      🚪 Logout
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-item" onClick={() => navigate("/login")}>
                Login
              </div>
            )}

            {/* CART */}
            <div className="nav-item cart" onClick={() => navigate("/cart")}>
              Cart 🛒
              {cartItems.length > 0 && (
                <span className="cart-count">
                  {cartItems.length}
                </span>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* CATEGORY BAR */}
      <div className="category-bar">
        <div className="category-container">
          <div onClick={() => navigate("/category/all")}>All</div>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat._id} onClick={() => navigate(`/category/${cat.name.toLowerCase()}`)}>
                {cat.icon} {cat.name}
              </div>
            ))
          ) : (
            <>
              <div onClick={() => navigate("/category/bowls")}>🍗 Bowls</div>
              <div onClick={() => navigate("/category/plates")}>🍽️ Plates</div>
              <div onClick={() => navigate("/category/glasses")}>🥃 Glasses</div>
              <div onClick={() => navigate("/category/cutlery")}>🥄 Spoons & Forks</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;