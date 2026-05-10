import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Verify admin access
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/login");
      return;
    }

    // Placeholder - showing no orders section
    // Add backend API call when order endpoint is ready
    setLoading(false);
    setMessage("Order management system coming soon");
    setType("info");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Orders</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="admin-content">
        {message && (
          <div className={`auth-message ${type}`} style={{ 
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            background: type === "info" ? "#cfe2ff" : "#d1e7dd",
            color: type === "info" ? "#084298" : "#0f5132",
            border: type === "info" ? "1px solid #b6d4fe" : "1px solid #badbcc"
          }}>
            {message}
          </div>
        )}

        <div className="admin-card" style={{ marginBottom: "20px" }}>
          <h3>📋 All Orders</h3>
          <p>Total Orders: <strong>{orders.length}</strong></p>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 40px", background: "#f9fafb", borderRadius: "8px" }}>
              <h4 style={{ color: "#374151", marginBottom: "10px" }}>⏳ Loading Orders...</h4>
              <p style={{ color: "#6b7280" }}>Please wait while we fetch your orders</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "8px",
              color: "white"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>📦</div>
              <h4 style={{ fontSize: "22px", marginBottom: "8px", color: "white" }}>No Orders Yet</h4>
              <p style={{ fontSize: "15px", color: "#e0e7ff", marginBottom: "20px" }}>
                Orders placed by customers will appear here.
              </p>
              <p style={{ fontSize: "13px", color: "#c7d2fe" }}>
                ✓ All customer purchases will be listed once they start placing orders.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Order ID</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Customer</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Items</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Total</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>#{order.id}</td>
                      <td style={{ padding: "12px" }}>{order.customer}</td>
                      <td style={{ padding: "12px" }}>{order.items}</td>
                      <td style={{ padding: "12px" }}>₹{order.total}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          background: "#ffd814",
                          color: "#000",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button style={{
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => navigate("/admin")}
            style={{
              background: "#6c757d",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              transition: "background 0.3s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#5a6268"}
            onMouseLeave={(e) => e.target.style.background = "#6c757d"}
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
