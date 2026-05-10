import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminRecommendations.css";
import Toast from "../components/Toast";

const AdminRecommendations = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [bulkStatus, setBulkStatus] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    // Only load if authenticated as admin - otherwise stop here
    if (role !== "admin" || !token) {
      navigate("/admin-login");
      return;
    }

    fetchCustomers();
  }, [token, role]);

  const fetchCustomers = async () => {
    try {
      // Validate auth before attempting to fetch
      const currentToken = localStorage.getItem("token");
      const currentRole = localStorage.getItem("role");

      if (!currentToken || currentRole !== "admin") {
        navigate("/admin-login");
        return;
      }

      // Validate token format
      if (!currentToken.includes(".")) {
        console.error("❌ Invalid token format");
        setToast({
          type: "error",
          message: "Session expired - please login again",
        });
        navigate("/admin-login");
        return;
      }

      // Get all customers with watch history
      const response = await fetch("http://localhost:5000/api/products/watch-analytics", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("❌ Authentication failed");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/admin-login");
          return;
        } else if (response.status === 403) {
          console.error("❌ Authorization failed - user is not admin");
          navigate("/admin-login");
          return;
        }
        throw new Error(`Failed to fetch analytics (${response.status})`);
      }

      const data = await response.json();
      
      // Extract unique emails from product watch analytics
      const uniqueEmails = new Set();
      data.products?.forEach((product) => {
        product.customerViews?.forEach((view) => {
          uniqueEmails.add(view.email);
        });
      });

      setCustomers(Array.from(uniqueEmails).map((email) => ({
        email,
        name: email.split("@")[0],
      })));
    } catch (err) {
      console.error("Error fetching customers:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to load customers",
      });
    }
  };

  const sendToCustomer = async () => {
    if (!selectedCustomer) {
      setToast({
        type: "error",
        message: "Please select a customer",
      });
      return;
    }

    try {
      // Validate authentication
      if (!token || !token.includes(".")) {
        throw new Error("Session expired - please login again");
      }

      setLoading(true);
      const response = await fetch("http://localhost:5000/api/products/recommendations/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedCustomer,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          throw new Error("Session expired - please login again");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to send recommendations");
        }
        const errData = await response.json();
        throw new Error(errData.message || `Failed to send recommendation (${response.status})`);
      }

      const data = await response.json();
      setToast({
        type: "success",
        message: `Recommendation sent to ${selectedCustomer}! (${data.recommendationCount} items)`,
      });
      setSelectedCustomer("");
    } catch (err) {
      console.error("Error sending recommendation:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to send recommendation",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkRecommendations = async () => {
    try {
      // Validate authentication
      if (!token || !token.includes(".")) {
        throw new Error("Session expired - please login again");
      }

      setLoading(true);
      setBulkStatus("Sending recommendations to all customers...");

      const response = await fetch("http://localhost:5000/api/products/recommendations/bulk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          throw new Error("Session expired - please login again");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to send bulk recommendations");
        }
        const errData = await response.json();
        throw new Error(errData.message || `Failed to send recommendations (${response.status})`);
      }

      const data = await response.json();
      setToast({
        type: "success",
        message: `Sent recommendations to ${data.customersSent} customers!`,
      });
      setBulkStatus(`✅ Successfully sent to ${data.customersSent} customers`);
    } catch (err) {
      console.error("Error sending bulk recommendations:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to send bulk recommendations",
      });
      setBulkStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerPreferences = async (email) => {
    try {
      // Validate authentication
      if (!token || !token.includes(".")) {
        throw new Error("Session expired - please login again");
      }

      const response = await fetch(
        `http://localhost:5000/api/products/recommendations/preferences?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          throw new Error("Session expired - please login again");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view customer preferences");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch preferences (${response.status})`);
      }

      const data = await response.json();
      console.log(`Preferences for ${email}:`, data.preferences);
      
      // Build preference message
      let preferenceMessage = `Customer Preferences for ${email}:\n\n`;
      
      // Watch history
      if (data.preferences.topCategories && data.preferences.topCategories.length > 0) {
        preferenceMessage += `📊 Watch History:\n${data.preferences.topCategories
          .map((cat) => `• ${cat.category}: ${cat.watchCount} views (${cat.percentage}%)`)
          .join("\n")}\n\n`;
      } else {
        preferenceMessage += `📊 Watch History: No watch history yet ⏳\n\n`;
      }
      
      // Wishlist
      preferenceMessage += `❤️ Wishlist Items: ${data.preferences.wishlistCount || 0}`;
      
      if (data.preferences.wishlistCount > 0) {
        preferenceMessage += ` items`;
      }
      
      alert(preferenceMessage);
    } catch (err) {
      console.error("Error fetching preferences:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to fetch customer preferences",
      });
    }
  };

  return (
    <div className="admin-recommendations-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="ar-header">
        <h1>📧 Recommendation System</h1>
        <p>Send AI-powered personalized product recommendations to customers based on their watch history + wishlist</p>
      </div>

      {/* Stats */}
      <div className="ar-stats">
        <div className="ar-stat-card">
          <h3>👥 Total Customers</h3>
          <p className="ar-stat-number">{customers.length}</p>
          <span>With watch history or wishlist</span>
        </div>
        <div className="ar-stat-card">
          <h3>📨 Recommendations</h3>
          <p className="ar-stat-number">Ready</p>
          <span>AI-powered system</span>
        </div>
        <div className="ar-stat-card">
          <h3>🎯 Data Sources</h3>
          <p className="ar-stat-number">2+</p>
          <span>Watch history + Wishlist</span>
        </div>
      </div>

      {/* Send to Single Customer */}
      <div className="ar-section">
        <h2>Send to Individual Customer</h2>
        <div className="ar-form">
          <div className="ar-form-group">
            <label>Select Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="ar-select"
            >
              <option value="">-- Choose a customer --</option>
              {customers.map((customer) => (
                <option key={customer.email} value={customer.email}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="ar-actions">
            <button
              className="ar-btn ar-btn-primary"
              onClick={sendToCustomer}
              disabled={loading || !selectedCustomer}
            >
              {loading ? "Sending..." : "📧 Send Recommendation"}
            </button>

            {selectedCustomer && (
              <button
                className="ar-btn ar-btn-secondary"
                onClick={() => getCustomerPreferences(selectedCustomer)}
                disabled={loading}
              >
                👁️ View Preferences
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Send */}
      <div className="ar-section ar-section-bulk">
        <h2>📲 Send to All Customers (Bulk)</h2>
        <p className="ar-section-description">
          Send personalized recommendations to all {customers.length} customers at once
        </p>

        <div className="ar-bulk-warning">
          <strong>⚠️ Smart Recommendation Engine:</strong> This will send personalized recommendations to{" "}
          <strong>all {customers.length} customers</strong> based on BOTH their unique:
          <ul style={{ marginTop: "10px", marginBottom: "0" }}>
            <li>📊 <strong>Watch History</strong> - Products they've viewed and categories they browse</li>
            <li>❤️ <strong>Wishlist Items</strong> - Products they've saved for later</li>
          </ul>
          <p style={{ marginTop: "12px", marginBottom: "0", fontSize: "14px" }}>
            Each email includes: category preferences, recommended new products, wishlist availability status, and special offers!
          </p>
        </div>

        <div className="ar-bulk-actions">
          <button
            className="ar-btn ar-btn-bulk"
            onClick={sendBulkRecommendations}
            disabled={loading || customers.length === 0}
          >
            {loading ? "Processing..." : "🚀 Send to All Customers"}
          </button>
        </div>

        {bulkStatus && (
          <div className="ar-bulk-status">
            <p>{bulkStatus}</p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="ar-section ar-section-info">
        <h2>🔍 How the Smart Recommendation Engine Works</h2>
        <div className="ar-info-grid">
          <div className="ar-info-card">
            <h3>1️⃣ Data Collection</h3>
            <p>
              System collects customer's watch history (browsed products) and wishlist items
            </p>
          </div>
          <div className="ar-info-card">
            <h3>2️⃣ Watch History Analysis</h3>
            <p>
              Analyzes browsing patterns to identify preferred categories and viewing frequency
            </p>
          </div>
          <div className="ar-info-card">
            <h3>3️⃣ Wishlist Tracking</h3>
            <p>
              Monitors wishlist items for price drops, stock availability, and new similar products
            </p>
          </div>
          <div className="ar-info-card">
            <h3>4️⃣ Smart Filtering</h3>
            <p>
              Recommends products customer hasn't seen yet but matches their interests and wishlist
            </p>
          </div>
          <div className="ar-info-card">
            <h3>5️⃣ Personalized Email</h3>
            <p>
              Sends beautiful HTML email with category insights, recommendations, and wishlist updates
            </p>
          </div>
          <div className="ar-info-card">
            <h3>6️⃣ Re-Engagement 📈</h3>
            <p>
              Customers receive relevant recommendations increasing store visits and conversions
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="ar-section ar-section-features">
        <h2>✨ Features</h2>
        <div className="ar-features-list">
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>Dual-Source Recommendations</h4>
              <p>Uses both watch history AND wishlist for comprehensive recommendations</p>
            </div>
          </div>
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>Real-Time Data Sync</h4>
              <p>Live tracking of browsing activity, wishlist changes, and inventory status</p>
            </div>
          </div>
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>Beautiful Email Templates</h4>
              <p>Professional HTML emails with product images, pricing, discounts, and stock info</p>
            </div>
          </div>
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>Smart Category Targeting</h4>
              <p>Recommendations based on customer's top browsed categories</p>
            </div>
          </div>
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>Wishlist Alerts</h4>
              <p>Notifies when wishlist items are in stock or have price drops</p>
            </div>
          </div>
          <div className="ar-feature">
            <span className="ar-feature-icon">✅</span>
            <div>
              <h4>New Arrival Notifications</h4>
              <p>Highlights new products in customer's favorite browsed categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="ar-footer">
        <button className="ar-btn ar-btn-back" onClick={() => navigate("/admin")}>
          ← Back to Admin Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminRecommendations;
